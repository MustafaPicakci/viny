import NotFoundException from "../../core/common/exception/NotFoundException.js";
import type Conversation from "../../core/conversation/Conversation.js";
import type ConversationPort from "../../core/conversation/Conversationport.js";
import type { Db } from "../db/Db.js";

export default class ConversationAdapter implements ConversationPort {
  constructor(private readonly db: Db) {}
  listForUser(userId: number): Promise<Conversation[]> {
    return this.db("conversations")
      .whereRaw("participants @> ?", [JSON.stringify([userId])])
      .select("*") as Promise<Conversation[]>;
  }
  async create(conversation: Omit<Conversation, "id">): Promise<Conversation> {
    const [id] = await this.db("conversations").insert(conversation).returning("id");
    return { ...conversation, id } as Conversation;
  }
  async findByName(name: string): Promise<Conversation> {
    const result = await this.db("conversations").where({ name }).first();
    if (!result) {
      throw new NotFoundException("Conversation not found");
    }
    return result as Conversation;
  }
  async findByParticipants(participants: number[]): Promise<Conversation> {
    const result = await this.db("conversations").where({ participants }).first();
    if (!result) {
      throw new NotFoundException("Conversation not found");
    }
    return result as Conversation;
  }
  async findById(id: number): Promise<Conversation> {
    const result = await this.db("conversations").where({ id }).first();
    if (!result) {
      throw new NotFoundException("Conversation not found");
    }
    return result as Conversation;
  }
  async list(): Promise<Conversation[]> {
    return (await this.db("conversations").select("*")) as Conversation[];
  }
  async addParticipant(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
    const updatedParticipants = Array.from(new Set([...conversation.participants, userId]));
    await this.db("conversations").where({ id: conversationId }).update({ participants: updatedParticipants });
  }
}
