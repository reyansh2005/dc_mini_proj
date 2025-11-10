import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class ServerSimple {
    private static Map<Integer, PrintWriter> clients = new ConcurrentHashMap<>();
    private static int coordinatorId = -1;
    private static int logicalClock = 0;
    
    // In-memory storage instead of SQLite database
    private static Map<String, String> documents = new ConcurrentHashMap<>();

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java ServerSimple <port>");
            return;
        }
        int PORT = Integer.parseInt(args[0]);

        try {
            // Initialize with some sample files
            initInMemoryStorage();

            try (ServerSocket serverSocket = new ServerSocket(PORT)) {
                System.out.println("[Server] Started on port " + PORT + " (In-Memory Mode)");

                while (true) {
                    Socket socket = serverSocket.accept();
                    new Thread(new ClientHandler(socket)).start();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void initInMemoryStorage() {
        // Add some sample files for testing
        documents.put("example.txt", "This is an example text file.");
        documents.put("hello.txt", "Hello, World!");
        documents.put("readme.md", "# README\n\nThis is a sample markdown file.");
        System.out.println("[Server] Initialized in-memory storage with " + documents.size() + " files");
    }

    private static synchronized void startElection() {
        if (clients.isEmpty()) {
            coordinatorId = -1;
            return;
        }

        System.out.println("[Server] Starting election process...");
        int highestId = clients.keySet().stream().max(Integer::compare).orElse(-1);
        coordinatorId = highestId;
        
        broadcast("COORDINATOR " + coordinatorId);
        System.out.println("[Server] New coordinator elected: " + coordinatorId);
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
        // Remove dead clients
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

                // Read client ID
                String clientIdStr = in.readLine();
                if (clientIdStr != null) {
                    clientId = Integer.parseInt(clientIdStr.trim());
                    clients.put(clientId, out);
                    System.out.println("[Server] Client " + clientId + " connected");

                    // Send initial coordinator info
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
                System.out.println("[Server] Client " + clientId + " disconnected: " + e.getMessage());
            } finally {
                cleanup();
            }
        }

        private void handleCommand(String command) {
            String[] parts = command.split(" ", 3);
            String action = parts[0].toUpperCase();

            System.out.println("[Server] Client " + clientId + " command: " + command);
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
                        System.out.println("[Server] Unknown command from client " + clientId + ": " + action);
                }
            } catch (Exception e) {
                out.println("ERROR " + e.getMessage());
                System.out.println("[Server] Error processing command: " + e.getMessage());
                e.printStackTrace();
            }
        }

        private void handleUpload(String[] parts) {
            if (parts.length < 3) {
                out.println("ERROR Upload format: UPLOAD <filename> <base64_content>");
                return;
            }

            String filename = parts[1];
            String base64Content = parts[2];

            try {
                // Decode base64 content
                String content = new String(Base64.getDecoder().decode(base64Content));
                
                // Store in memory
                documents.put(filename, content);
                
                out.println("OK File uploaded: " + filename);
                System.out.println("[Server] File uploaded: " + filename + " (size: " + content.length() + " chars)");
                
                // Broadcast to other clients about the new file
                broadcast("FILE_ADDED " + filename);
                
            } catch (Exception e) {
                out.println("ERROR Failed to upload file: " + e.getMessage());
                System.out.println("[Server] Upload failed for " + filename + ": " + e.getMessage());
            }
        }

        private void handleList() {
            try {
                StringBuilder fileList = new StringBuilder();
                fileList.append("FILES ");
                
                if (documents.isEmpty()) {
                    fileList.append("No files available");
                } else {
                    boolean first = true;
                    for (String filename : documents.keySet()) {
                        if (!first) fileList.append(",");
                        fileList.append(filename);
                        first = false;
                    }
                }
                
                out.println(fileList.toString());
                System.out.println("[Server] Listed " + documents.size() + " files to client " + clientId);
                
            } catch (Exception e) {
                out.println("ERROR Failed to list files: " + e.getMessage());
                System.out.println("[Server] List failed: " + e.getMessage());
            }
        }

        private void handleDownload(String[] parts) {
            if (parts.length < 2) {
                out.println("ERROR Download format: DOWNLOAD <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                String content = documents.get(filename);
                if (content != null) {
                    // Encode content as base64 for transmission
                    String encodedContent = Base64.getEncoder().encodeToString(content.getBytes());
                    out.println("FILE " + filename + " " + encodedContent);
                    System.out.println("[Server] File downloaded by client " + clientId + ": " + filename);
                } else {
                    out.println("ERROR File not found: " + filename);
                    System.out.println("[Server] File not found: " + filename);
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to download file: " + e.getMessage());
                System.out.println("[Server] Download failed for " + filename + ": " + e.getMessage());
            }
        }

        private void handleView(String[] parts) {
            if (parts.length < 2) {
                out.println("ERROR View format: VIEW <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                String content = documents.get(filename);
                if (content != null) {
                    // For view, send content directly (not base64 encoded)
                    out.println("CONTENT " + content);
                    System.out.println("[Server] File viewed by client " + clientId + ": " + filename);
                } else {
                    out.println("ERROR File not found: " + filename);
                    System.out.println("[Server] File not found: " + filename);
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to view file: " + e.getMessage());
                System.out.println("[Server] View failed for " + filename + ": " + e.getMessage());
            }
        }

        private void handleDelete(String[] parts) {
            if (parts.length < 2) {
                out.println("ERROR Delete format: DELETE <filename>");
                return;
            }

            String filename = parts[1];
            
            try {
                if (documents.containsKey(filename)) {
                    documents.remove(filename);
                    out.println("OK File deleted: " + filename);
                    System.out.println("[Server] File deleted: " + filename);
                    
                    // Broadcast to other clients about the deleted file
                    broadcast("FILE_DELETED " + filename);
                } else {
                    out.println("ERROR File not found: " + filename);
                    System.out.println("[Server] Delete failed - file not found: " + filename);
                }
                
            } catch (Exception e) {
                out.println("ERROR Failed to delete file: " + e.getMessage());
                System.out.println("[Server] Delete failed for " + filename + ": " + e.getMessage());
            }
        }

        private void cleanup() {
            try {
                if (clientId != -1) {
                    clients.remove(clientId);
                    System.out.println("[Server] Client " + clientId + " cleaned up");
                    
                    // Check if coordinator left
                    if (clientId == coordinatorId) {
                        System.out.println("[Server] Coordinator " + coordinatorId + " left, starting new election");
                        startElection();
                    }
                }
                socket.close();
            } catch (IOException e) {
                System.out.println("[Server] Cleanup error: " + e.getMessage());
            }
        }
    }
}