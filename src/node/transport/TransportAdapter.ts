import type Message from "../../core/message/Message.js";
import type ConnectionRegistry from "../../core/transport/ConnectionRegistry.js";
import type TransportPort from "../../core/transport/TransportPort.js";

export default class TransportAdapter implements TransportPort {
  constructor(private readonly registry: ConnectionRegistry) {}
  transport(message: Message, recipients: number[]): Promise<void> {
    const payload = JSON.stringify(message);
    for (const recipient of recipients) {
      const socket = this.registry.getConnection(recipient);
      if (socket && socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    }
    return Promise.resolve();
  }
}
