import axios from "axios";
import type Message from "../../core/message/Message.js";

export type VinyClientOptions = {
  address: string;
  port: number;
  token?: string;
};

export type MessageHandler = (message: Message) => void;
export default class VinyClient {
  private static instance: VinyClient;
  private token: string | undefined;
  private socket?: WebSocket;
  private readonly messageHandlers = new Set<MessageHandler>();

  private constructor(private readonly options: VinyClientOptions) {
    axios.defaults.baseURL = `http://${options.address}:${options.port}/api`;
    this.token = options.token;
  }

  public static getInstance(options: VinyClientOptions): VinyClient {
    if (!VinyClient.instance) {
      this.instance = new VinyClient(options);
    }
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
    // this.connectWebSocket();

    return data;
  }
  private async connectWebSocket() {
    if (!this.token) {
      throw new Error("Not authenticated");
    }
    this.socket = new WebSocket(`ws://${this.options.address}:${this.options.port}/ws?token=${encodeURIComponent(this.token)}`);
    this.socket.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      this.messageHandlers.forEach((handler) => handler(message));
    };
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;
    this.socket.close();
    delete this.socket;
  }
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
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
  async searchUsers(query: string) {
    return axios.get(`/users/search`, { params: { query } });
  }
  async listConversations() {
    return axios.get("/conversations");
  }
  async fetchMessages(conversationId: number) {
    return axios.get(`/conversations/${conversationId}/messages`);
  }
}
