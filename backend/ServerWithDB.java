import java.io.*;
import java.net.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class ServerWithDB {
    private static Map<Integer, PrintWriter> clients = new ConcurrentHashMap<>();
    private static int coordinatorId = -1;
    private static int logicalClock = 0;
    
    private static Connection sharedConn; // Shared database connection

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java ServerWithDB <port>");
            return;
        }
        int PORT = Integer.parseInt(args[0]);

        try {
            // Try to connect to existing SQLite database
            initDatabase();

            try (ServerSocket serverSocket = new ServerSocket(PORT)) {
                System.out.println("[ServerWithDB] Started on port " + PORT + " with SQLite Database");

                while (true) {
                    Socket socket = serverSocket.accept();
                    new Thread(new ClientHandler(socket)).start();
                }
            }
        } catch (Exception e) {
            System.err.println("[ServerWithDB] Failed to start: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void initDatabase() throws Exception {
        // Try to find and connect to the SQLite database
        File dbFile = new File("shared.db");
        if (!dbFile.exists()) {
            dbFile = new File("backend/shared.db");
        }
        if (!dbFile.exists()) {
            dbFile = new File("../shared.db");
        }
        
        if (dbFile.exists()) {
            try {
                Class.forName("org.sqlite.JDBC");
                String dbPath = dbFile.getAbsolutePath();
                sharedConn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
                System.out.println("[ServerWithDB] Connected to SQLite database: " + dbPath);
                
                // Verify database structure
                verifyDatabaseStructure();
                
            } catch (ClassNotFoundException e) {
                System.out.println("[ServerWithDB] SQLite JDBC driver not found, falling back to in-memory mode");
                throw e;
            }
        } else {
            System.out.println("[ServerWithDB] SQLite database not found, falling back to in-memory mode");
            throw new Exception("Database file not found");
        }
    }
    
    private static void verifyDatabaseStructure() throws SQLException {
        Statement stmt = sharedConn.createStatement();
        
        // Check if documents table exists, create if not
        ResultSet rs = stmt.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'");
        if (!rs.next()) {
            stmt.execute("CREATE TABLE documents (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "name TEXT UNIQUE," +
                        "content TEXT)");
            System.out.println("[ServerWithDB] Created documents table");
        }
        
        // Count existing documents
        rs = stmt.executeQuery("SELECT COUNT(*) FROM documents");
        if (rs.next()) {
            int count = rs.getInt(1);
            System.out.println("[ServerWithDB] Found " + count + " documents in database");
        }
        
        rs.close();
        stmt.close();
    }

    private static synchronized void startElection() {
        if (clients.isEmpty()) {
            coordinatorId = -1;
            return;
        }

        System.out.println("[ServerWithDB] Starting election process...");
        int highestId = clients.keySet().stream().max(Integer::compare).orElse(-1);
        coordinatorId = highestId;
        
        broadcast("COORDINATOR " + coordinatorId);
        System.out.println("[ServerWithDB] New coordinator elected: " + coordinatorId);
    }

    private static synchronized void broadcast(String message) {
        List<Integer> deadClients = new ArrayList<>();
        for (Map.Entry<Integer, PrintWriter> entry : clients.entrySet()) {
            try {
                entry.getValue().println(message);
            } catch (Exception e) {
                deadClients.add(entry.getKey());
            }
        }
        for (int deadClient : deadClients) {
            clients.remove(deadClient);
        }
    }

    private static synchronized int incrementClock() {
        return ++logicalClock;
    }

    static class ClientHandler implements Runnable {
        private Socket socket;
        private PrintWriter out;
        private BufferedReader in;
        private int clientId = -1;

        public ClientHandler(Socket socket) {
            this.socket = socket;
        }

        public void run() {
            try {
                out = new PrintWriter(socket.getOutputStream(), true);
                in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

                String clientIdStr = in.readLine();
                if (clientIdStr != null) {
                    clientId = Integer.parseInt(clientIdStr.trim());
                    clients.put(clientId, out);
                    System.out.println("[ServerWithDB] Client " + clientId + " connected");

                    if (coordinatorId != -1) {
                        out.println("COORDINATOR " + coordinatorId);
                    } else {
                        startElection();
                    }
                }

                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    handleCommand(inputLine.trim());
                }
            } catch (IOException e) {
                System.out.println("[ServerWithDB] Client " + clientId + " disconnected");
            } finally {
                cleanup();
            }
        }

        private void handleCommand(String command) {
            String[] parts = command.split(" ", 3);
            String action = parts[0].toUpperCase();

            System.out.println("[ServerWithDB] Client " + clientId + " command: " + command);
            incrementClock();

            try {
                switch (action) {
                    case "UPLOAD":
                        handleUpload(parts);
                        break;
                    case "LIST":
                        handleList();
                        break;
                    case "DOWNLOAD":
                        handleDownload(parts);
                        break;
                    case "VIEW":
                        handleView(parts);
                        break;
                    case "DELETE":
                        handleDelete(parts);
                        break;
                    case "ELECTION":
                        startElection();
                        break;
                    default:
                        out.println("ERROR Unknown command: " + action);
                }
            } catch (Exception e) {
                out.println("ERROR " + e.getMessage());
                System.err.println("[ServerWithDB] Error: " + e.getMessage());
                e.printStackTrace();
            }
        }

        private void handleUpload(String[] parts) throws SQLException {
            if (parts.length < 3) {
                out.println("ERROR Upload format: UPLOAD <filename> <base64_content>");
                return;
            }

            String filename = parts[1];
            String base64Content = parts[2];

            try {
                String content = new String(Base64.getDecoder().decode(base64Content));
                
                if (sharedConn != null) {
                    // Store in database
                    PreparedStatement stmt = sharedConn.prepareStatement(
                        "INSERT OR REPLACE INTO documents (name, content) VALUES (?, ?)");
                    stmt.setString(1, filename);
                    stmt.setString(2, content);
                    stmt.executeUpdate();
                    stmt.close();
                    
                    System.out.println("[ServerWithDB] File stored in database: " + filename);
                }
                
                out.println("OK File uploaded: " + filename);
                broadcast("FILE_ADDED " + filename);
                
            } catch (Exception e) {
                out.println("ERROR Failed to upload: " + e.getMessage());
            }
        }

        private void handleList() throws SQLException {
            try {
                StringBuilder fileList = new StringBuilder();
                fileList.append("FILES ");
                
                if (sharedConn != null) {
                    Statement stmt = sharedConn.createStatement();
                    ResultSet rs = stmt.executeQuery("SELECT name FROM documents ORDER BY name");
                    
                    boolean first = true;
                    while (rs.next()) {
                        if (!first) fileList.append(",");
                        fileList.append(rs.getString("name"));
                        first = false;
                    }
                    
                    if (first) {
                        fileList.append("No files available");
                    }
                    
                    rs.close();
                    stmt.close();
                } else {
                    fileList.append("No files available");
                }
                
                out.println(fileList.toString());
                System.out.println("[ServerWithDB] Listed files to client " + clientId);
                
            } catch (Exception e) {
                out.println("ERROR Failed to list files: " + e.getMessage());
            }
        }

        private void handleDownload(String[] parts) throws SQLException {
            if (parts.length < 2) {
                out.println("ERROR Download format: DOWNLOAD <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                if (sharedConn != null) {
                    PreparedStatement stmt = sharedConn.prepareStatement(
                        "SELECT content FROM documents WHERE name = ?");
                    stmt.setString(1, filename);
                    ResultSet rs = stmt.executeQuery();
                    
                    if (rs.next()) {
                        String content = rs.getString("content");
                        String encodedContent = Base64.getEncoder().encodeToString(content.getBytes());
                        out.println("FILE " + filename + " " + encodedContent);
                        System.out.println("[ServerWithDB] File downloaded: " + filename);
                    } else {
                        out.println("ERROR File not found: " + filename);
                    }
                    
                    rs.close();
                    stmt.close();
                } else {
                    out.println("ERROR Database not available");
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to download: " + e.getMessage());
            }
        }

        private void handleView(String[] parts) throws SQLException {
            if (parts.length < 2) {
                out.println("ERROR View format: VIEW <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                if (sharedConn != null) {
                    PreparedStatement stmt = sharedConn.prepareStatement(
                        "SELECT content FROM documents WHERE name = ?");
                    stmt.setString(1, filename);
                    ResultSet rs = stmt.executeQuery();
                    
                    if (rs.next()) {
                        String content = rs.getString("content");
                        out.println("CONTENT " + content);
                        System.out.println("[ServerWithDB] File viewed: " + filename);
                    } else {
                        out.println("ERROR File not found: " + filename);
                    }
                    
                    rs.close();
                    stmt.close();
                } else {
                    out.println("ERROR Database not available");
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to view: " + e.getMessage());
            }
        }

        private void handleDelete(String[] parts) throws SQLException {
            if (parts.length < 2) {
                out.println("ERROR Delete format: DELETE <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                if (sharedConn != null) {
                    PreparedStatement stmt = sharedConn.prepareStatement(
                        "DELETE FROM documents WHERE name = ?");
                    stmt.setString(1, filename);
                    int deleted = stmt.executeUpdate();
                    stmt.close();
                    
                    if (deleted > 0) {
                        out.println("OK File deleted: " + filename);
                        System.out.println("[ServerWithDB] File deleted: " + filename);
                        broadcast("FILE_DELETED " + filename);
                    } else {
                        out.println("ERROR File not found: " + filename);
                    }
                } else {
                    out.println("ERROR Database not available");
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to delete: " + e.getMessage());
            }
        }

        private void cleanup() {
            try {
                if (clientId != -1) {
                    clients.remove(clientId);
                    System.out.println("[ServerWithDB] Client " + clientId + " cleaned up");
                    
                    if (clientId == coordinatorId) {
                        startElection();
                    }
                }
                socket.close();
            } catch (IOException e) {
                System.err.println("[ServerWithDB] Cleanup error: " + e.getMessage());
            }
        }
    }
}