// import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createServer, type Server as HttpServer } from "node:http";
// import http from "http";
import { WebSocketServer, type WebSocket } from "ws";

import type AuthenticationPort from "../../core/auth/AuthenticationPort.js";
import type LoginUsecase from "../../core/auth/usecase/LoginUsecase.js";
import type RegisterUsecase from "../../core/auth/usecase/RegisterUsecase.js";
import UnauthorizedException from "../../core/common/exception/UnauthorizedException.js";
import type ConnectionRegistry from "../../core/transport/ConnectionRegistry.js";
import type SearchUserUsecase from "../../core/user/usecase/SearchUserUsecase.js";
import type UserPort from "../../core/user/UserPort.js";

// const app = express();
// app.use(cors());

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// const server = http.createServer(app);
// const wss = new WebSocketServer({ server });

// wss.on("connection", (ws) => {
//   console.log("New WebSocket connection");
//   ws.send("Welcome to the WebSocket server!");
// });

// server.on("upgrade", (req, socket, head) => {
//   // Extract token from query string or header
//   const url = new URL(req.url!);
//   const token = url.searchParams.get("token");

//   if (!token) {
//     socket.write("HTTP/1.1 401 Unauthorized");
//     socket.destroy();
//     return;
//   }
// });

// server.listen(4000, () => {
//   console.log("Server is listening on port 4000");
// });

// wss.on("connection", (ws) => {
//   ws.on("message", (data) => {
//     const msg = JSON.parse(data.toString());
//     console.log(msg);
//     if (msg.type === "subscribe") {
//       //   if (!canAccess(ws.user, msg.channel)) {
//       //     ws.send(JSON.stringify({ error: "Forbidden" }));
//       //     return;
//       //   }
//       //   channels.get(msg.channel)?.add(ws);
//     }
//   });
// });
interface AuthedRequest extends Request {
  userId?: number;
}

export interface VinyServerOptions {
  port: number;
  host: string;
  registry: ConnectionRegistry;
  authenticationPort: AuthenticationPort;
  userPort: UserPort;
  usecases: {
    register: RegisterUsecase;
    login: LoginUsecase;
    searchUsers: SearchUserUsecase;
    // createDM: CreateDMUsecase;
    // createRoom: CreateRoomUsecase;
    // joinRoom: JoinRoomUsecase;
    // sendMessage: SendMessageUsecase;
    // listConversations: ListConversationsUsecase;
    // fetchMessages: FetchMessagesUsecase;
  };
}

export default class VinyServer {
  private app?: Express;
  private httpServer?: HttpServer;
  private wsServer?: WebSocketServer;
  // private readonly host?: Host;

  constructor(private options: VinyServerOptions) {}

  async start(): Promise<void> {
    this.app = express();
    this.registerRoutes(this.app);
    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocketServer({ server: this.httpServer, path: "/viny/ws" });
    this.wireWebsocket(this.wsServer);
  }

  private wireWebsocket(wss: WebSocketServer) {
    wss.on("connection", async (ws: WebSocket, req) => {
      console.log("New WebSocket connection");

      const token = this.extractToken(req.url || "");
      const payload = token ? await this.options.authenticationPort.validateToken(token) : null;

      if (!payload) {
        ws.send(JSON.stringify({ error: "Unauthorized" }));
        ws.close();
        return;
      }

      this.options.registry.addConnection(payload.userId, ws);
      ws.on("close", () => this.options.registry.removeConnection(payload.userId));
      ws.on("error", () => this.options.registry.removeConnection(payload.userId));
    });
  }

  private extractToken(rawUrl: string): string | null {
    try {
      const url = new URL(rawUrl);
      return url.searchParams.get("token");
    } catch {
      return null;
    }
  }
  async stop(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
    this.options.registry.clear();
  }

  private async requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }
    const payload = await this.options.authenticationPort.validateToken(header.slice("Bearer ".length));
    if (!payload) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.userId = payload.userId;
    next();
  }

  private registerRoutes(app: Express) {
    const { usecases } = this.options;

    app.post("/auth/register", async (req, res, next) => {
      try {
        const user = await usecases.register.handle({ username: req.body.username, password: req.body.password });
        res.status(201).json({ id: user.id, username: user.username });
      } catch (err) {
        next(err);
      }
    });
    app.post("/auth/login", async (req, res, next) => {
      try {
        const result = await usecases.login.handle({ username: req.body.username, password: req.body.password });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    });

    const requireAuth = this.requireAuth.bind(this);

    app.get("/users", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const query = typeof req.query.q === "string" ? req.query.q : "";
        const users = await usecases.searchUsers.handle({ requestedBy: requestedBy.id, query });
        res.json(users);
      } catch (err) {
        next(err);
      }
    });
  }
  private async loadUser(userId: number) {
    const user = await this.options.userPort.findById(userId);
    if (!user) throw new UnauthorizedException("User no longer exists");
    return user;
  }
}
