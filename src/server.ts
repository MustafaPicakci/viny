import type { Request, Response } from "express";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { registerHost } from "./discovery.js";

export default class Server {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  runServer() {
    try {
      const app = express();
      app.use(express.json());

      app.get("/health", (req: Request, res: Response) => {
        res.send(`Http server is running!`);
      });

      app.post("/auth/register", (req: Request, res: Response) => {
        res.send(`mock register`);
      });

      app.post("/auth/login", (req: Request, res: Response) => {
        res.send(`mock login!`);
      });

      const server = http.createServer(app);

      const wsServer = new WebSocketServer({ server });
      wsServer.on("connection", (socket) => {
        console.log("WebSocket Server: Client connected");

        socket.on("message", (message) => {
          console.log("WebSocket Server: Received from client:", message.toString());
          socket.send("Hello client! I got your message: " + message.toString());
        });

        socket.on("close", () => console.log("WebSocket Server: Client disconnected"));
      });

      server.listen(4000, "0.0.0.0", () => {});
      registerHost(this.name);
    } catch (error) {
      console.error("Error starting server:", error);
    }
  }
}

const name = process.argv[2];

if (name) {
  new Server(name).runServer();
}

// import net from "net";
// import { registerHost } from "./discovery.js";

// export default class Server {
//   name: string;

//   constructor(name: string) {
//     this.name = name;
//   }

//   runServer() {
//     const server = net.createServer((socket) => {
//       console.log("TCP Server: Client connected:", socket.remoteAddress);

//       socket.on("data", (data) => {
//         console.log("TCP Server: Receive from client:", data.toString());
//         socket.write("Hello client! I got your message: " + data.toString());
//       });

//       socket.on("close", () => console.log("TCP Server: Client disconnected"));
//     });

//     server.listen(4000, "0.0.0.0", () => {
//       const address = server.address();
//       if (!address || typeof address === "string") {
//         throw new Error("Server address could not be resolved");
//       }

//       const unregister = registerHost(this.name, address.port);

//       const shutdown = () => {};

//       process.once("SIGINT", shutdown);
//       process.once("SIGTERM", shutdown);

//       console.log(`TCP Server: ${this.name} listening on 0.0.0.0:${address.port}`);
//     });
//   }
// }

// const name = process.argv[2];
// console.log(name);

// if (name) new Server(name).runServer();
