import axios from "axios";
import type { SendMessageResponse } from "../../core/message/usecase/SendMessageUsecase.js";

export type VinyClientOptions = {
  address: string;
  port?: number;
  token?: string;
};

export type MessageHandler = (message: SendMessageResponse) => void;
export default class VinyClient {
  private static instance: VinyClient;
  private token: string | undefined;
  private socket?: WebSocket;
  // private readonly messageHandlers = new Set<MessageHandler>();
  private messageHandler?: MessageHandler;

  private readonly baseUrl: string;
  private readonly wsUrl: string;

  private constructor(options: VinyClientOptions) {
    const isUrl = options.address.startsWith("http://") || options.address.startsWith("https://");
    if (isUrl) {
      const base = options.address.replace(/\/$/, "");
      this.baseUrl = `${base}/api`;
      this.wsUrl = base.replace(/^http/, "ws");
    } else {
      this.baseUrl = `http://${options.address}:${options.port}/api`;
      this.wsUrl = `ws://${options.address}:${options.port}`;
    }
    axios.defaults.baseURL = this.baseUrl;
    this.token = options.token;
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

  async register(username: string, password: string) {
    return axios.post("/auth/register", { username, password });
  }

  async login(username: string, password: string) {
    const { data } = await axios.post("/auth/login", { username, password });
    this.token = data.token;
    axios.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;

    return { data };
  }
  private async connectWebSocket() {
    if (!this.token) {
      throw new Error("Not authenticated");
    }

    this.socket = new WebSocket(`${this.wsUrl}/ws?token=${encodeURIComponent(this.token)}`);
    this.socket.onmessage = (event) => {
      const raw = JSON.parse(event.data);
      const message: SendMessageResponse = { ...raw, timestamp: new Date(raw.timestamp) };
      this.messageHandler?.(message);
    };
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
    return axios.post(`/conversations/${conversationId}/messages`, { text });
  }

  async logout() {
    return axios.get("/auth/logout");
  }

  async connect() {
    await this.connectWebSocket();
  }

  async ping(): Promise<void> {
    await axios.get("/health", { timeout: 3000 });
  }
  async searchUsers(query: string) {
    return axios.get(`/users/search`, { params: { q: query } });
  }
  async listConversations() {
    return axios.get("/conversations");
  }
  async fetchMessages(conversationId: number) {
    return axios.get(`/conversations/${conversationId}/messages`);
  }
  async createRoom(name: string) {
    return axios.post("/room", { name });
  }
  async addRoomParticipant(roomName: string, username: string) {
    return axios.post(`/room/${roomName}/participants`, { username });
  }
  async dmUser(username: string) {
    return axios.post("/dm", { peerUsername: username });
  }

  async getRoomParticipants(name: string) {
    return axios.get(`/room/${encodeURIComponent(name)}/participants`);
  }
}
