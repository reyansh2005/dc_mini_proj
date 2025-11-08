import java.io.*;
import java.net.*;
import java.util.Scanner;

public class Client {
    private static int clientId = -1;
    private static String lastRequestedFile = null;

    public static void main(String[] args) {
        try (Socket socket = new Socket("127.0.0.1", 12345); // connect to LoadBalancer
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             Scanner scanner = new Scanner(System.in)) {

            // Listener thread
            new Thread(() -> {
                try {
                    String msg;
                    while ((msg = in.readLine()) != null) {
                        if (msg.startsWith("ASSIGN_ID")) {
                            clientId = Integer.parseInt(msg.split(" ")[1]);
                            System.out.println("[CLIENT] Connected. Assigned clientId = " + clientId);
                        } else if (msg.startsWith("COORDINATOR")) {
                            System.out.println(msg.substring(12));
                        } else if (msg.startsWith("FILE File not found")) {
                            System.out.println("File not found.");
                        } else if (msg.startsWith("FILE ")) {
                            String content = msg.substring(5);
                            try {
                                String fname = (lastRequestedFile != null) ? lastRequestedFile : "downloaded_file.txt";
                                FileOutputStream fos = new FileOutputStream("downloaded_" + fname);
                                fos.write(content.getBytes());
                                fos.close();
                                System.out.println("File '" + fname + "' saved as downloaded_" + fname);
                            } catch (IOException e) {
                                System.out.println("Error saving file.");
                            }
                        } else {
                            System.out.println(msg);
                        }
                    }
                } catch (IOException e) {
                    System.out.println("[CLIENT] Connection closed.");
                }
            }).start();

            // Menu
            while (true) {
                System.out.println("\nMenu:");
                System.out.println("1) Upload file");
                System.out.println("2) Download file");
                System.out.println("3) View file");
                System.out.println("4) Delete file");
                System.out.println("5) Show Coordinator");
                System.out.println("6) Exit");
                System.out.print("Choice: ");
                String choice = scanner.nextLine();

                if ("1".equals(choice)) {
                    System.out.print("Enter local file path: ");
                    String path = scanner.nextLine();
                    File f = new File(path);
                    if (!f.exists()) {
                        System.out.println("File not found!");
                        continue;
                    }
                    String content = new String(java.nio.file.Files.readAllBytes(f.toPath()));
                    out.println("upload " + f.getName() + "::" + content);
                } else if ("2".equals(choice)) {
                    System.out.print("Enter filename to download: ");
                    String fname = scanner.nextLine();
                    lastRequestedFile = fname;
                    out.println("download " + fname);
                } else if ("3".equals(choice)) {
                    System.out.print("Enter filename to view: ");
                    out.println("view " + scanner.nextLine());
                } else if ("4".equals(choice)) {
                    System.out.print("Enter filename to delete: ");
                    out.println("delete " + scanner.nextLine());
                } else if ("5".equals(choice)) {
                    out.println("coordinator");
                } else if ("6".equals(choice)) {
                    out.println("exit");
                    break;
                } else {
                    System.out.println("Invalid choice.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
