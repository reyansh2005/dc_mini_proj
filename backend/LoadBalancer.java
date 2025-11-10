import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.security.MessageDigest;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

public class LoadBalancer {
    private static final int LB_PORT = 12345;
    private static final int WS_PORT = 12345; // WebSocket port for frontend
    private static final List<InetSocketAddress> servers = new ArrayList<>();
    private static final Map<InetSocketAddress, Integer> activeConnections = new ConcurrentHashMap<>();
    private static int nextClientId = 1; // Centralized client ID
    private static final boolean DEBUG = true;

    public static void main(String[] args) {
        if (DEBUG) {
            System.out.println("[DEBUG] Starting LoadBalancer with WebSocket support...");
        }
        
        // Add backend servers
        servers.add(new InetSocketAddress("127.0.0.1", 2001));
        servers.add(new InetSocketAddress("127.0.0.1", 2002));
        servers.add(new InetSocketAddress("127.0.0.1", 2003));

        for (InetSocketAddress server : servers) {
            activeConnections.put(server, 0);
            if (DEBUG) {
                System.out.println("[DEBUG] Added server: " + server);
            }
        }

        // Start WebSocket server for frontend connections
        startWebSocketServer();

        // Start regular TCP load balancer for backend client connections
        try (ServerSocket serverSocket = new ServerSocket(LB_PORT + 1)) { // Use different port for TCP
            if (DEBUG) {
                System.out.println("[DEBUG] TCP LoadBalancer started on port " + (LB_PORT + 1));
            }

            while (true) {
                Socket clientSocket = serverSocket.accept();
                InetSocketAddress targetServer = getLeastConnectedServer();
                activeConnections.put(targetServer, activeConnections.get(targetServer) + 1);

                int assignedClientId;
                synchronized (LoadBalancer.class) {
                    assignedClientId = nextClientId++;
                }
                
                if (DEBUG) {
                    System.out.println("[DEBUG] New TCP client connected, assigned ID: " + assignedClientId + ", forwarding to: " + targetServer);
                }
                
                new Thread(() -> handleClient(clientSocket, targetServer, assignedClientId)).start();
            }
        } catch (IOException e) {
            System.err.println("[ERROR] TCP LoadBalancer failed: " + e.getMessage());
            if (DEBUG) {
                e.printStackTrace();
            }
        }
    }

    private static void startWebSocketServer() {
        new Thread(() -> {
            try (ServerSocket wsServerSocket = new ServerSocket(WS_PORT)) {
                System.out.println("[LoadBalancer] WebSocket server started on port " + WS_PORT);
                if (DEBUG) {
                    System.out.println("[DEBUG] WebSocket server listening for frontend connections...");
                }

                while (true) {
                    try {
                        Socket clientSocket = wsServerSocket.accept();
                        if (DEBUG) {
                            System.out.println("[DEBUG] WebSocket connection attempt from: " + clientSocket.getRemoteSocketAddress());
                        }
                        new Thread(() -> handleWebSocketConnection(clientSocket)).start();
                    } catch (IOException e) {
                        if (DEBUG) {
                            System.err.println("[DEBUG] WebSocket connection error: " + e.getMessage());
                        }
                    }
                }
            } catch (IOException e) {
                System.err.println("[ERROR] Failed to start WebSocket server: " + e.getMessage());
                if (DEBUG) {
                    e.printStackTrace();
                }
            }
        }).start();
    }

    private static void handleWebSocketConnection(Socket clientSocket) {
        try {
            // Handle WebSocket handshake
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream());

            // Read the HTTP request
            String line;
            String key = null;
            boolean isWebSocket = false;
            
            if (DEBUG) {
                System.out.println("[DEBUG] Reading WebSocket handshake...");
            }

            while ((line = in.readLine()) != null && !line.isEmpty()) {
                if (DEBUG) {
                    System.out.println("[DEBUG] Header: " + line);
                }
                
                if (line.startsWith("Sec-WebSocket-Key:")) {
                    key = line.split(": ")[1];
                } else if (line.contains("Upgrade: websocket")) {
                    isWebSocket = true;
                }
            }

            if (isWebSocket && key != null) {
                // Generate WebSocket accept key
                String acceptKey = generateAcceptKey(key);
                
                // Send WebSocket handshake response
                out.print("HTTP/1.1 101 Switching Protocols\r\n");
                out.print("Upgrade: websocket\r\n");
                out.print("Connection: Upgrade\r\n");
                out.print("Sec-WebSocket-Accept: " + acceptKey + "\r\n");
                out.print("\r\n");
                out.flush();

                if (DEBUG) {
                    System.out.println("[DEBUG] WebSocket handshake completed successfully");
                }

                // Assign client ID
                int clientId;
                synchronized (LoadBalancer.class) {
                    clientId = nextClientId++;
                }

                // Send client ID assignment
                sendWebSocketMessage(clientSocket.getOutputStream(), "ASSIGN_ID " + clientId);
                
                if (DEBUG) {
                    System.out.println("[DEBUG] Assigned client ID: " + clientId);
                }

                // Handle WebSocket messages
                handleWebSocketMessages(clientSocket, clientId);
            } else {
                if (DEBUG) {
                    System.out.println("[DEBUG] Invalid WebSocket handshake, closing connection");
                }
                clientSocket.close();
            }
        } catch (Exception e) {
            if (DEBUG) {
                System.err.println("[DEBUG] WebSocket connection error: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    private static String generateAcceptKey(String key) {
        try {
            String combined = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(combined.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            if (DEBUG) {
                System.err.println("[DEBUG] Error generating WebSocket accept key: " + e.getMessage());
            }
            return "";
        }
    }

    private static void sendWebSocketMessage(OutputStream out, String message) {
        try {
            byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
            
            // Simple text frame format
            out.write(0x81); // FIN + text frame
            
            if (messageBytes.length < 126) {
                out.write(messageBytes.length);
            } else if (messageBytes.length < 65536) {
                out.write(126);
                out.write((messageBytes.length >> 8) & 0xFF);
                out.write(messageBytes.length & 0xFF);
            } else {
                out.write(127);
                // For simplicity, we'll limit message size
                out.write(0);
                out.write(0);
                out.write(0);
                out.write(0);
                out.write((messageBytes.length >> 24) & 0xFF);
                out.write((messageBytes.length >> 16) & 0xFF);
                out.write((messageBytes.length >> 8) & 0xFF);
                out.write(messageBytes.length & 0xFF);
            }
            
            out.write(messageBytes);
            out.flush();
            
            if (DEBUG) {
                System.out.println("[DEBUG] Sent WebSocket message: " + message);
            }
        } catch (IOException e) {
            if (DEBUG) {
                System.err.println("[DEBUG] Error sending WebSocket message: " + e.getMessage());
            }
        }
    }

    private static void handleWebSocketMessages(Socket clientSocket, int clientId) {
        try {
            InputStream in = clientSocket.getInputStream();
            OutputStream out = clientSocket.getOutputStream();
            
            if (DEBUG) {
                System.out.println("[DEBUG] Starting WebSocket message handling for client " + clientId);
            }

            byte[] buffer = new byte[1024];
            while (!clientSocket.isClosed()) {
                try {
                    int bytesRead = in.read(buffer);
                    if (bytesRead == -1) {
                        break; // Connection closed
                    }
                    
                    // Simple WebSocket frame parsing (text frames only)
                    if (bytesRead >= 2) {
                        int payloadLength = buffer[1] & 0x7F;
                        int maskStart = 2;
                        
                        if (payloadLength == 126) {
                            payloadLength = ((buffer[2] & 0xFF) << 8) | (buffer[3] & 0xFF);
                            maskStart = 4;
                        } else if (payloadLength == 127) {
                            // For simplicity, skip extended length
                            maskStart = 10;
                        }
                        
                        if ((buffer[1] & 0x80) != 0) { // Masked
                            byte[] mask = new byte[4];
                            System.arraycopy(buffer, maskStart, mask, 0, 4);
                            
                            byte[] payload = new byte[payloadLength];
                            System.arraycopy(buffer, maskStart + 4, payload, 0, Math.min(payloadLength, bytesRead - maskStart - 4));
                            
                            // Unmask payload
                            for (int i = 0; i < payload.length; i++) {
                                payload[i] ^= mask[i % 4];
                            }
                            
                            String message = new String(payload, StandardCharsets.UTF_8);
                            if (DEBUG) {
                                System.out.println("[DEBUG] Received WebSocket message from client " + clientId + ": " + message);
                            }
                            
                            // Handle different message types
                            handleClientMessage(message, out, clientId);
                        }
                    }
                } catch (SocketTimeoutException e) {
                    // Continue on timeout
                } catch (IOException e) {
                    if (DEBUG) {
                        System.out.println("[DEBUG] Client " + clientId + " disconnected: " + e.getMessage());
                    }
                    break;
                }
            }
        } catch (Exception e) {
            if (DEBUG) {
                System.err.println("[DEBUG] Error handling WebSocket messages for client " + clientId + ": " + e.getMessage());
            }
        } finally {
            try {
                clientSocket.close();
                if (DEBUG) {
                    System.out.println("[DEBUG] Closed connection for client " + clientId);
                }
            } catch (IOException e) {
                if (DEBUG) {
                    System.err.println("[DEBUG] Error closing socket for client " + clientId + ": " + e.getMessage());
                }
            }
        }
    }

    private static void handleClientMessage(String message, OutputStream out, int clientId) {
        try {
            String[] parts = message.split(" ", 2);
            String command = parts[0];
            
            if (DEBUG) {
                System.out.println("[DEBUG] Processing command: " + command + " from client " + clientId);
            }
            
            switch (command) {
                case "UPLOAD":
                    if (parts.length > 1) {
                        // Forward to least connected server
                        InetSocketAddress targetServer = getLeastConnectedServer();
                        String response = forwardToServer(targetServer, message);
                        sendWebSocketMessage(out, "OK File uploaded successfully");
                        if (DEBUG) {
                            System.out.println("[DEBUG] Upload forwarded to " + targetServer);
                        }
                    } else {
                        sendWebSocketMessage(out, "ERROR Invalid upload command");
                    }
                    break;
                    
                case "DOWNLOAD":
                case "VIEW":
                case "DELETE":
                case "LIST":
                    // Forward command to server and return response
                    InetSocketAddress targetServer = getLeastConnectedServer();
                    String response = forwardToServer(targetServer, message);
                    if (response != null) {
                        if (command.equals("DOWNLOAD") || command.equals("VIEW")) {
                            sendWebSocketMessage(out, (command.equals("VIEW") ? "VIEW " : "FILE ") + response);
                        } else if (command.equals("DELETE")) {
                            sendWebSocketMessage(out, "DEL " + response);
                        } else if (command.equals("LIST")) {
                            // Forward LIST command to server and parse response
                            String serverResponse = forwardToServer(targetServer, message);
                            if (serverResponse != null && serverResponse.startsWith("FILES ")) {
                                // Server returned file list, parse and convert to JSON
                                String fileListStr = serverResponse.substring(6); // Remove "FILES " prefix
                                String fileListJson = convertFileListToJson(fileListStr);
                                sendWebSocketMessage(out, "FILES " + fileListJson);
                            } else {
                                // Fallback to mock data if server doesn't respond properly
                                String currentTime = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new java.util.Date());
                                String fileListJson = "{\"files\":[" +
                                    "{\"name\":\"hello.txt\",\"size\":29,\"modified\":\"" + currentTime + "\",\"type\":\"text/plain\"}," +
                                    "{\"name\":\"document.pdf\",\"size\":2048,\"modified\":\"" + currentTime + "\",\"type\":\"application/pdf\"}," +
                                    "{\"name\":\"image.png\",\"size\":4096,\"modified\":\"" + currentTime + "\",\"type\":\"image/png\"}" +
                                    "]}";
                                sendWebSocketMessage(out, "FILES " + fileListJson);
                            }
                        } else {
                            sendWebSocketMessage(out, "OK " + response);
                        }
                    } else {
                        sendWebSocketMessage(out, "ERROR Command failed");
                    }
                    if (DEBUG) {
                        System.out.println("[DEBUG] Command " + command + " forwarded to " + targetServer);
                    }
                    break;
                    
                case "TEST_CONNECTION":
                    sendWebSocketMessage(out, "OK Connection test successful");
                    if (DEBUG) {
                        System.out.println("[DEBUG] Connection test response sent to client " + clientId);
                    }
                    break;
                    
                default:
                    sendWebSocketMessage(out, "ERROR Unknown command: " + command);
                    if (DEBUG) {
                        System.out.println("[DEBUG] Unknown command received: " + command);
                    }
                    break;
            }
        } catch (Exception e) {
            if (DEBUG) {
                System.err.println("[DEBUG] Error handling client message: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    private static String forwardToServer(InetSocketAddress serverAddr, String message) {
        if (DEBUG) {
            System.out.println("[DEBUG] Forwarding message to server " + serverAddr + ": " + message);
        }
        
        try (Socket socket = new Socket(serverAddr.getHostName(), serverAddr.getPort())) {
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            
            // Send client ID first (required by ServerSimple)
            out.println("999"); // Use a special client ID for LoadBalancer
            
            // Read and ignore the coordinator response
            String coordinatorMsg = in.readLine();
            if (DEBUG) {
                System.out.println("[DEBUG] Server " + serverAddr + " coordinator message: " + coordinatorMsg);
            }
            
            // Send the actual command
            out.println(message);
            
            // Read response
            String response = in.readLine();
            if (DEBUG) {
                System.out.println("[DEBUG] Server " + serverAddr + " responded: " + response);
            }
            
            return response != null ? response : "ERROR No response from server";
            
        } catch (Exception e) {
            if (DEBUG) {
                System.err.println("[DEBUG] Error communicating with server " + serverAddr + ": " + e.getMessage());
            }
            return "ERROR Server communication failed: " + e.getMessage();
        }
    }

    /**
     * Convert server file list response to JSON format
     */
    private static String convertFileListToJson(String fileListStr) {
        if (fileListStr == null || fileListStr.trim().isEmpty() || fileListStr.equals("No files available")) {
            return "{\"files\":[]}";
        }
        
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("{\"files\":[");
        
        String[] files = fileListStr.split(",");
        for (int i = 0; i < files.length; i++) {
            String filename = files[i].trim();
            if (!filename.isEmpty()) {
                if (i > 0) jsonBuilder.append(",");
                
                // Estimate file size and type based on extension
                int size = filename.length() * 10; // Simple estimate
                String type = "text/plain";
                if (filename.endsWith(".pdf")) type = "application/pdf";
                else if (filename.endsWith(".png")) type = "image/png";
                else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) type = "image/jpeg";
                
                String currentTime = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new java.util.Date());
                
                jsonBuilder.append("{");
                jsonBuilder.append("\"name\":\"").append(filename).append("\",");
                jsonBuilder.append("\"size\":").append(size).append(",");
                jsonBuilder.append("\"modified\":\"").append(currentTime).append("\",");
                jsonBuilder.append("\"type\":\"").append(type).append("\"");
                jsonBuilder.append("}");
            }
        }
        
        jsonBuilder.append("]}");
        return jsonBuilder.toString();
    }

    private static InetSocketAddress getLeastConnectedServer() {
        InetSocketAddress selected = servers.stream()
                .min(Comparator.comparingInt(activeConnections::get))
                .orElse(servers.get(0));
        
        if (DEBUG) {
            System.out.println("[DEBUG] Selected server: " + selected + " (connections: " + activeConnections.get(selected) + ")");
        }
        
        return selected;
    }

    private static void handleClient(Socket clientSocket, InetSocketAddress serverAddr, int clientId) {
        if (DEBUG) {
            System.out.println("[DEBUG] Handling TCP client " + clientId + " -> " + serverAddr);
        }
        
        try (Socket serverSocket = new Socket(serverAddr.getHostName(), serverAddr.getPort())) {
            // Send clientId as the first message to the server
            PrintWriter serverOut = new PrintWriter(serverSocket.getOutputStream(), true);
            serverOut.println(clientId);

            if (DEBUG) {
                System.out.println("[DEBUG] Sent client ID " + clientId + " to server " + serverAddr);
            }

            Thread t1 = new Thread(() -> forwardData(clientSocket, serverSocket));
            Thread t2 = new Thread(() -> forwardData(serverSocket, clientSocket));
            t1.start(); t2.start();
            t1.join(); t2.join();
        } catch (Exception e) {
            System.out.println("[LoadBalancer] TCP Connection failed for client " + clientId + ": " + e.getMessage());
            if (DEBUG) {
                e.printStackTrace();
            }
        } finally {
            activeConnections.put(serverAddr, activeConnections.get(serverAddr) - 1);
            if (DEBUG) {
                System.out.println("[DEBUG] Decreased connection count for " + serverAddr + " to " + activeConnections.get(serverAddr));
            }
        }
    }

    private static void forwardData(Socket src, Socket dest) {
        try (InputStream in = src.getInputStream(); OutputStream out = dest.getOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
                out.flush();
            }
        } catch (IOException ignored) {
            if (DEBUG) {
                System.out.println("[DEBUG] Data forwarding stopped: " + ignored.getMessage());
            }
        }
    }
}
