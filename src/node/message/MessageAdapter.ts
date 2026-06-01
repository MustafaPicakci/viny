import type Message from "../../core/message/Message.js";
import type MessagePort from "../../core/message/MessagePort.js";
import type { Db } from "../db/Db.js";

export default class MessageAdapter implements MessagePort {
  constructor(private readonly db: Db) {}
  async create(message: Message): Promise<Message> {
    const [id] = await this.db("messages").insert(message).returning("id");
    return { ...message, id } as Message;
  }
  async findByConversationId(conversationId: number): Promise<Message[]> {
    return (await this.db("messages").where({ conversationId }).select("*")) as Message[];
  }
}
