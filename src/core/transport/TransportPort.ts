import type Message from "../message/Message.js";

export default interface TransportPort {
  transport(message: Message, recipients: number[]): Promise<void>;
}
