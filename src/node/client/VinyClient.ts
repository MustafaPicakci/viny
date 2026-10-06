import axios, { type AxiosInstance } from "axios";
import https from "node:https";
import WebSocket from "ws";
import type { SendMessageResponse } from "../../core/message/usecase/SendMessageUsecase.js";
import { resolveTlsTrust, type UnknownCertificateHandler } from "../tls/TlsTrust.js";

export type VinyClientOptions = {
  address: string;
  port?: number;
  token?: string;
  onUnknownCertificate?: UnknownCertificateHandler;
};

export type MessageHandler = (message: SendMessageResponse) => void;
export default class VinyClient {
  private static instance: VinyClient;
  private token: string | undefined;
  private socket?: WebSocket;
  // private readonly messageHandlers = new Set<MessageHandler>();
  private messageHandler?: MessageHandler;

  private readonly origin: URL;
  private readonly http: AxiosInstance;
  private readonly onUnknownCertificate: UnknownCertificateHandler;
  private httpsAgent?: https.Agent;
  private trustReady?: Promise<void>;

  private constructor(options: VinyClientOptions) {
    const isUrl = options.address.startsWith("http://") || options.address.startsWith("https://");
    // Plain host:port always means TLS; unencrypted HTTP only when explicitly asked for with an http:// URL.
    this.origin = new URL(isUrl ? options.address : `https://${options.address}:${options.port}`);
    this.http = axios.create({ baseURL: `${this.base()}/api` });
    this.http.interceptors.request.use(async (config) => {
      await this.establishTrust();
      if (this.httpsAgent) config.httpsAgent = this.httpsAgent;
      return config;
    });
    this.onUnknownCertificate = options.onUnknownCertificate ?? (async () => false);
    this.token = options.token;
    if (this.token) this.http.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
  }

  public static getInstance(options: VinyClientOptions): VinyClient {
    if (!VinyClient.instance) {
      this.instance = new VinyClient(options);
    }
    return VinyClient.instance;
  }

  public static reset(options: VinyClientOptions): VinyClient {
    this.instance = new VinyClient(options);
    return VinyClient.instance;
  }
  getToken(): string | undefined {
    return this.token;
  }

  private base(): string {
    return this.origin.href.replace(/\/$/, "");
  }

  isEncrypted(): boolean {
    return this.origin.protocol === "https:";
  }

  // Resolved once per client; concurrent requests wait on the same check so the user is prompted only once.
  private establishTrust(): Promise<void> {
    if (!this.isEncrypted()) return Promise.resolve();
    this.trustReady ??= (async () => {
      const port = this.origin.port ? Number(this.origin.port) : 443;
      this.httpsAgent = new https.Agent(await resolveTlsTrust(this.origin.hostname, port, this.onUnknownCertificate));
    })().catch((err) => {
      delete this.trustReady;
      throw err;
    });
    return this.trustReady;
  }

  async register(username: string, password: string) {
    return this.http.post("/auth/register", { username, password });
  }

  async login(username: string, password: string) {
    const { data } = await this.http.post("/auth/login", { username, password });
    this.token = data.token;
    this.http.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;

    return { data };
  }
  private async connectWebSocket() {
    if (!this.token) {
      throw new Error("Not authenticated");
    }

    const wsUrl = `${this.base().replace(/^http/, "ws")}/ws?token=${encodeURIComponent(this.token)}`;
    await this.establishTrust();
    const socket = new WebSocket(wsUrl, this.httpsAgent ? { agent: this.httpsAgent } : {});
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });
    // After the handshake a failure only means the connection dropped; "close" follows.
    socket.on("error", () => {});
    socket.onmessage = (event) => {
      const raw = JSON.parse(String(event.data));
      const message: SendMessageResponse = { ...raw, timestamp: new Date(raw.timestamp) };
      this.messageHandler?.(message);
    };
    this.socket = socket;
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;
    this.socket.close();
    delete this.socket;
  }
  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  async sendMessage(conversationId: number, text: string) {
    return this.http.post(`/conversations/${conversationId}/messages`, { text });
  }

  async logout() {
    return this.http.get("/auth/logout");
  }

  async connect() {
    await this.connectWebSocket();
  }

  async ping(): Promise<void> {
    await this.http.get("/health", { timeout: 3000 });
  }
  async searchUsers(query: string) {
    return this.http.get(`/users/search`, { params: { q: query } });
  }
  async listConversations() {
    return this.http.get("/conversations");
  }
  async fetchMessages(conversationId: number) {
    return this.http.get(`/conversations/${conversationId}/messages`);
  }
  async createRoom(name: string) {
    return this.http.post("/room", { name });
  }
  async addRoomParticipant(roomName: string, username: string) {
    return this.http.post(`/room/${roomName}/participants`, { username });
  }
  async dmUser(username: string) {
    return this.http.post("/dm", { peerUsername: username });
  }

  async getRoomParticipants(name: string) {
    return this.http.get(`/room/${encodeURIComponent(name)}/participants`);
  }
}
