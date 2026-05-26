import NotFoundException from "../../core/common/exception/NotFoundException.js";
import type Conversation from "../../core/conversation/Conversation.js";
import type ConversationPort from "../../core/conversation/Conversationport.js";
import type { Db } from "../db/Db.js";

export default class ConversationAdapter implements ConversationPort {
  constructor(private readonly db: Db) {}
  async create(conversation: Conversation): Promise<Conversation> {
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
  async findByParticipants(participants: string[]): Promise<Conversation> {
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
}
