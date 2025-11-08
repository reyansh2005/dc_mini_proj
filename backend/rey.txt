import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class LoadBalancer {
    private static final int LB_PORT = 12345;
    private static final List<InetSocketAddress> servers = new ArrayList<>();
    private static final Map<InetSocketAddress, Integer> activeConnections = new ConcurrentHashMap<>();
    private static int nextClientId = 1; // Centralized client ID

    public static void main(String[] args) {
        // Add backend servers
        servers.add(new InetSocketAddress("127.0.0.1", 2001));
        servers.add(new InetSocketAddress("127.0.0.1", 2002));
        servers.add(new InetSocketAddress("127.0.0.1", 2003));

        for (InetSocketAddress server : servers) {
            activeConnections.put(server, 0);
        }

        try (ServerSocket serverSocket = new ServerSocket(LB_PORT)) {
            System.out.println("[LoadBalancer] Running on port " + LB_PORT);

            while (true) {
                Socket clientSocket = serverSocket.accept();
                InetSocketAddress targetServer = getLeastConnectedServer();
                activeConnections.put(targetServer, activeConnections.get(targetServer) + 1);

                int assignedClientId;
                synchronized (LoadBalancer.class) {
                    assignedClientId = nextClientId++;
                }
                new Thread(() -> handleClient(clientSocket, targetServer, assignedClientId)).start();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static InetSocketAddress getLeastConnectedServer() {
        return servers.stream()
                .min(Comparator.comparingInt(activeConnections::get))
                .orElse(servers.get(0));
    }

    private static void handleClient(Socket clientSocket, InetSocketAddress serverAddr, int clientId) {
        try (Socket serverSocket = new Socket(serverAddr.getHostName(), serverAddr.getPort())) {
            // Send clientId as the first message to the server
            PrintWriter serverOut = new PrintWriter(serverSocket.getOutputStream(), true);
            serverOut.println(clientId);

            Thread t1 = new Thread(() -> forwardData(clientSocket, serverSocket));
            Thread t2 = new Thread(() -> forwardData(serverSocket, clientSocket));
            t1.start(); t2.start();
            t1.join(); t2.join();
        } catch (Exception e) {
            System.out.println("[LoadBalancer] Connection failed: " + e.getMessage());
        } finally {
            activeConnections.put(serverAddr, activeConnections.get(serverAddr) - 1);
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
        } catch (IOException ignored) {}
    }
}
