import type Conversation from "./Conversation.js";

export default interface ConversationPort {
  create(conversation: Conversation): Promise<Conversation>;
  findByName(name: string): Promise<Conversation>;
  findByParticipants(participants: string[]): Promise<Conversation>;
  findById(id: number): Promise<Conversation>;
  list(): Promise<Conversation[]>;
}
