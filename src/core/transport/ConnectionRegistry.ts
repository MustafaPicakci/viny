import { type WebSocket } from "ws";

export default class ConnectionRegistry {
  private readonly connections: Map<number, WebSocket>;

  constructor() {
    this.connections = new Map();
  }

  addConnection(id: number, ws: WebSocket) {
    this.connections.set(id, ws);
  }

  removeConnection(id: number) {
    this.connections.delete(id);
  }

  getConnection(id: number): WebSocket | undefined {
    return this.connections.get(id);
  }

  clear() {
    this.connections.clear();
  }
}
