// src/client.ts
import net from "net";

export class Client {
  constructor() {}

  runClient() {
    // Connect to the server
    const client = net.createConnection({ host: "127.0.0.1", port: 4000 }, () => {
      console.log("TCP Client: Connected to server");
      // Send message
      client.write("Hello server! This is Client!");
    });

    // Receive data from the server
    client.on("data", (data) => {
      console.log("TCP Client: Received from server:", data.toString());
      client.end();
      // client.destroy();
    });

    // Handle close
    client.on("end", () => console.log("TCP Client: disconnected from server"));
  }
}
