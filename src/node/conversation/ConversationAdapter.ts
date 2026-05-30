import NotFoundException from "../../core/common/exception/NotFoundException.js";
import type Conversation from "../../core/conversation/Conversation.js";
import type ConversationPort from "../../core/conversation/Conversationport.js";
import type { Db } from "../db/Db.js";

type ConversationRow = Omit<Conversation, "participants"> & { participants: string };

export default class ConversationAdapter implements ConversationPort {
  constructor(private readonly db: Db) {}

  private hydrate(row: ConversationRow): Conversation {
    return { ...row, participants: JSON.parse(row.participants) } as Conversation;
  }

  async listForUser(userId: number): Promise<Conversation[]> {
    const rows = (await this.db("conversations")
      .whereRaw("EXISTS (SELECT 1 FROM json_each(conversations.participants) WHERE value = ?)", [userId])
      .select("*")) as ConversationRow[];
    return rows.map((r) => this.hydrate(r));
  }

  async create(conversation: Omit<Conversation, "id">): Promise<Conversation> {
    const [id] = await this.db("conversations")
      .insert({
        ...conversation,
        participants: JSON.stringify(conversation.participants),
      })
      .returning("id");
    return { ...conversation, id } as Conversation;
  }

  async findByName(name: string): Promise<Conversation> {
    const result = (await this.db("conversations").where({ name }).first()) as ConversationRow | undefined;
    if (!result) {
      throw new NotFoundException("Conversation not found");
    }
    return this.hydrate(result);
  }

  async findByParticipants(participants: number[]): Promise<Conversation> {
    const placeholders = participants.map(() => "?").join(",");
    const result = (await this.db("conversations")
      .whereRaw(
        `(SELECT COUNT(DISTINCT value) FROM json_each(conversations.participants)
          WHERE value IN (${placeholders})) = ?`,
        [...participants, participants.length],
      )
      .first()) as ConversationRow | undefined;

    if (!result) {
      return undefined!;
    }
    return this.hydrate(result);
  }

  async findById(id: number): Promise<Conversation> {
    const result = (await this.db("conversations").where({ id }).first()) as ConversationRow | undefined;
    if (!result) {
      throw new NotFoundException("Conversation not found");
    }
    return this.hydrate(result);
  }

  async list(): Promise<Conversation[]> {
    const rows = (await this.db("conversations").select("*")) as ConversationRow[];
    return rows.map((r) => this.hydrate(r));
  }

  async addParticipant(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.findById(conversationId);
    const updatedParticipants = Array.from(new Set([...conversation.participants, userId]));
    await this.db("conversations")
      .where({ id: conversationId })
      .update({ participants: JSON.stringify(updatedParticipants) });
  }
}
