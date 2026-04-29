import net from "net";
import { registerHost } from "./discovery.js";

export default class Server {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  runServer() {
    const server = net.createServer((socket) => {
      console.log("TCP Server: Client connected:", socket.remoteAddress);

      socket.on("data", (data) => {
        console.log("TCP Server: Receive from client:", data.toString());
        socket.write("Hello client! I got your message: " + data.toString());
      });

      socket.on("close", () => console.log("TCP Server: Client disconnected"));
    });

    server.listen(4000, "0.0.0.0", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Server address could not be resolved");
      }

      const unregister = registerHost(this.name, address.port);

      const shutdown = () => {};

      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);

      console.log(`TCP Server: ${this.name} listening on 0.0.0.0:${address.port}`);
    });
  }
}

const name = process.argv[2];
console.log(name);

if (name) new Server(name).runServer();
