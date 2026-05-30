// import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createServer, type Server as HttpServer } from "node:http";
// import http from "http";
import { WebSocketServer, type WebSocket } from "ws";

import type AuthenticationPort from "../../core/auth/AuthenticationPort.js";
import type LoginUsecase from "../../core/auth/usecase/LoginUsecase.js";
import type RegisterUsecase from "../../core/auth/usecase/RegisterUsecase.js";
import DuplicateException from "../../core/common/exception/DuplicateException.js";
import NotFoundException from "../../core/common/exception/NotFoundException.js";
import UnauthorizedException from "../../core/common/exception/UnauthorizedException.js";
import type AddRoomParticipantUsecase from "../../core/conversation/usecase/AddRoomParticioantUsecase.js";
import type CreateDMUsecase from "../../core/conversation/usecase/CreateDmUsecase.js";
import type CreateRoomUsecase from "../../core/conversation/usecase/CreateRoomUsecase.js";
import type JoinRoomUsecase from "../../core/conversation/usecase/JoinRoomUsecase.js";
import type ListConversationsUsecase from "../../core/conversation/usecase/ListConversationsUsecase.js";
import type FetchMessagesUsecase from "../../core/message/usecase/FetchMessagesUsecase.js";
import type SendMessageUsecase from "../../core/message/usecase/SendMessageUsecase.js";
import type ConnectionRegistry from "../../core/transport/ConnectionRegistry.js";
import type SearchUserUsecase from "../../core/user/usecase/SearchUserUsecase.js";
import type UserPort from "../../core/user/UserPort.js";

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
    createDM: CreateDMUsecase;
    createRoom: CreateRoomUsecase;
    joinRoom: JoinRoomUsecase;
    addRoomParticipant: AddRoomParticipantUsecase;
    sendMessage: SendMessageUsecase;
    listConversations: ListConversationsUsecase;
    fetchMessages: FetchMessagesUsecase;
  };
}

export default class VinyServer {
  private app?: Express;
  private httpServer?: HttpServer;
  private wsServer?: WebSocketServer;
  // private readonly host?: Host;

  constructor(private options: VinyServerOptions) {}

  start(): Promise<void> {
    this.app = express();
    this.app.use(express.json());
    this.registerRoutes(this.app);

    this.httpServer = createServer(this.app);
    this.wireErrorHandler(this.app);
    this.wsServer = new WebSocketServer({ server: this.httpServer, path: "/ws" });
    this.wireWebsocket(this.wsServer);

    return new Promise((resolve) => {
      this.httpServer!.listen(this.options.port, this.options.host, () => {
        console.log(`VinyServer listening on ${this.options.host}:${this.options.port}`);
        resolve();
      });
    });
  }

  private wireErrorHandler(app: Express): void {
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof DuplicateException) return res.status(409).json({ error: err.message });
      if (err instanceof NotFoundException) return res.status(404).json({ error: err.message });
      if (err instanceof UnauthorizedException) return res.status(401).json({ error: err.message });
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
  }

  private wireWebsocket(wss: WebSocketServer) {
    wss.on("connection", async (ws: WebSocket, req) => {
      const token = this.extractToken(req.url || "");
      const payload = token ? await this.options.authenticationPort.validateToken(token) : null;

      if (!payload) {
        ws.send(JSON.stringify({ error: "Unauthorized" }));
        ws.close();
        return;
      }

      this.options.registry.addConnection(payload.userId, ws);
      const cleanup = () => {
        if (this.options.registry.getConnection(payload.userId) === ws) {
          this.options.registry.removeConnection(payload.userId);
        }
      };
      ws.on("close", cleanup);
      ws.on("error", cleanup);
    });
  }

  private extractToken(rawUrl: string): string | null {
    const qIndex = rawUrl.indexOf("?");
    if (qIndex === -1) return null;
    return new URLSearchParams(rawUrl.slice(qIndex + 1)).get("token");
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

    app.post("/api/auth/register", async (req, res, next) => {
      try {
        const user = await usecases.register.handle({ username: req.body.username, password: req.body.password });
        res.status(201).json({ id: user.id, username: user.username });
      } catch (err) {
        next(err);
      }
    });
    app.post("/api/auth/login", async (req, res, next) => {
      try {
        const result = await usecases.login.handle({ username: req.body.username, password: req.body.password });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    });

    const requireAuth = this.requireAuth.bind(this);

    app.get("/api/users/search", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const query = typeof req.query.q === "string" ? req.query.q : "";
        const users = await usecases.searchUsers.handle({ requestedBy: requestedBy.id, query });
        res.json(users);
      } catch (err) {
        next(err);
      }
    });
    app.get("/api/conversations", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const conversations = await usecases.listConversations.handle({ requestedBy: requestedBy.id });
        res.json(conversations);
      } catch (err) {
        next(err);
      }
    });
    app.get("/api/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const messages = await usecases.fetchMessages.handle({
          requestedBy: requestedBy.id,
          conversationId: Number(req.params.id),
        });
        res.json(messages);
      } catch (err) {
        next(err);
      }
    });
    app.post("/api/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const messages = await usecases.sendMessage.handle({
          requestedBy: requestedBy.id,
          conversationId: Number(req.params.id),
          text: req.body.text,
          senderId: requestedBy.id,
        });
        res.json(messages);
      } catch (err) {
        next(err);
      }
    });

    app.post("/api/dm", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const { name, type, peerUsername } = req.body;

        const conversation = await usecases.createDM.handle({ requestedBy: requestedBy.id, peerUsername });
        res.status(201).json(conversation);
      } catch (err) {
        next(err);
      }
    });

    app.post("/api/room", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const { name } = req.body;

        const conversation = await usecases.createRoom.handle({ requestedBy: requestedBy.id, name });
        res.status(201).json(conversation);
      } catch (err) {
        next(err);
      }
    });
    app.post("/api/room/:id/participants", requireAuth, async (req: AuthedRequest, res, next) => {
      try {
        const requestedBy = await this.loadUser(req.userId!);
        const { name } = req.body;

        const conversation = await usecases.addRoomParticipant.handle({ requestedBy: requestedBy.id, conversationId: Number(req.params.id), username: name });
        res.status(200).json(conversation);
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
