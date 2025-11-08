import java.io.*;
import java.net.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class Server {
    private static Map<Integer, PrintWriter> clients = new ConcurrentHashMap<>();
    private static int coordinatorId = -1;
    private static int logicalClock = 0;

    private static Connection sharedConn; // Use a single shared DB

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java Server <port>");
            return;
        }
        int PORT = Integer.parseInt(args[0]);

        try {
            Class.forName("org.sqlite.JDBC");
            sharedConn = DriverManager.getConnection("jdbc:sqlite:shared.db"); // Shared DB for all servers
            initDatabase(sharedConn);

            try (ServerSocket serverSocket = new ServerSocket(PORT)) {
                System.out.println("[Server] Started on port " + PORT);

                while (true) {
                    Socket socket = serverSocket.accept();
                    new Thread(new ClientHandler(socket)).start();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void initDatabase(Connection conn) throws SQLException {
        Statement stmt = conn.createStatement();
        stmt.execute("CREATE TABLE IF NOT EXISTS documents (" +
                     "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                     "name TEXT UNIQUE," +
                     "content TEXT)");
        stmt.close();
    }

    private static synchronized void startElection() {
        if (clients.isEmpty()) {
            coordinatorId = -1;
            return;
        }
        coordinatorId = Collections.max(clients.keySet());
        broadcast("[ELECTION] Coordinator is now Client " + coordinatorId);
        System.out.println("[Server] Coordinator is now Client " + coordinatorId);
    }

    private static void broadcast(String msg) {
        for (PrintWriter pw : clients.values()) {
            pw.println("COORDINATOR " + msg);
        }
    }

    private static class ClientHandler implements Runnable {
        private Socket socket;
        private int clientId;
        private BufferedReader in;
        private PrintWriter out;

        public ClientHandler(Socket socket) {
            this.socket = socket;
        }

        @Override
        public void run() {
            try {
                in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                out = new PrintWriter(socket.getOutputStream(), true);

                // Read clientId from LoadBalancer as the first message
                String idLine = in.readLine();
                clientId = Integer.parseInt(idLine.trim());
                clients.put(clientId, out);

                System.out.println("[Server] Client " + clientId + " connected.");
                startElection();

                out.println("ASSIGN_ID " + clientId);

                String line;
                while ((line = in.readLine()) != null) {
                    handleCommand(line);
                }
            } catch (IOException e) {
                System.out.println("[Server] Connection closed for client " + clientId);
            } finally {
                try { socket.close(); } catch (IOException ignored) {}
                clients.remove(clientId);
                startElection();
            }
        }

        private void handleCommand(String line) {
            try {
                logicalClock++;
                String[] parts = line.split(" ", 2);
                String cmd = parts[0];

                if ("upload".equalsIgnoreCase(cmd)) {
                    String[] tokens = parts[1].split("::", 2);
                    if (tokens.length < 2) {
                        out.println("ERROR Invalid upload format.");
                        return;
                    }
                    String filename = tokens[0].trim();
                    String content = tokens[1];

                    upsertFile(sharedConn, filename, content);

                    backupDatabase(); // <-- Add this line

                    out.println("OK Upload of '" + filename + "' replicated | clock=" + logicalClock);

                } else if ("download".equalsIgnoreCase(cmd)) {
                    String filename = parts[1].trim();
                    String content = fetchFile(sharedConn, filename);
                    out.println(content != null ? "FILE " + content : "FILE File not found.");

                } else if ("view".equalsIgnoreCase(cmd)) {
                    String filename = parts[1].trim();
                    String content = fetchFile(sharedConn, filename);
                    out.println(content != null ? "VIEW --- " + filename + " ---\n" + content : "VIEW File not found.");

                } else if ("delete".equalsIgnoreCase(cmd)) {
                    String filename = parts[1].trim();
                    deleteFile(sharedConn, filename);
                    out.println("DEL File '" + filename + "' deleted.");

                } else if ("coordinator".equalsIgnoreCase(cmd)) {
                    out.println("COORD Current Coordinator: Client " + coordinatorId);

                } else if ("exit".equalsIgnoreCase(cmd)) {
                    out.println("BYE Goodbye!");
                    socket.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        private void upsertFile(Connection conn, String filename, String content) throws SQLException {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO documents(name, content) VALUES(?, ?) " +
                "ON CONFLICT(name) DO UPDATE SET content=excluded.content");
            ps.setString(1, filename);
            ps.setString(2, content);
            ps.executeUpdate();
            ps.close();
        }

        private String fetchFile(Connection conn, String filename) throws SQLException {
            PreparedStatement ps = conn.prepareStatement("SELECT content FROM documents WHERE name=?");
            ps.setString(1, filename);
            ResultSet rs = ps.executeQuery();
            String result = rs.next() ? rs.getString("content") : null;
            rs.close();
            ps.close();
            return result;
        }

        private void deleteFile(Connection conn, String filename) throws SQLException {
            PreparedStatement ps = conn.prepareStatement("DELETE FROM documents WHERE name=?");
            ps.setString(1, filename);
            ps.executeUpdate();
            ps.close();
        }
    }

    private static void backupDatabase() {
        try (InputStream in = new FileInputStream("shared.db");
         OutputStream out = new FileOutputStream("backup.db")) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            System.out.println("[Server] Backup failed: " + e.getMessage());
        }
    }
}
