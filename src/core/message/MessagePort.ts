import type Message from "./Message.js";

export default interface MessagePort {
  create(payload: Omit<Message, "id">): Promise<Message>;
  findByConversationId(conversationId: number): Promise<Message[]>;
}
