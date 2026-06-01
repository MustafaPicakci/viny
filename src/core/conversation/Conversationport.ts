import type Conversation from "./Conversation.js";

export default interface ConversationPort {
  create(conversation: Omit<Conversation, "id">): Promise<Conversation>;
  findByName(name: string): Promise<Conversation>;
  findByParticipants(participants: number[]): Promise<Conversation>;
  findById(id: number): Promise<Conversation>;
  list(): Promise<Conversation[]>;
  listForUser(userId: number): Promise<Conversation[]>;
  addParticipant(conversationId: number, userId: number): Promise<void>;
}
