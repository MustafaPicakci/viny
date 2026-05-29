import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface FindOrCreateConversationRequest {
  participants?: number[];
  name?: string;
}

export default class FindOrCreateConversationUsecase {
  constructor(private conversationPort: ConversationPort) {}

  async handle(payload: FindOrCreateConversationRequest): Promise<Conversation> {
    if (payload.name) {
      return await this.conversationPort.findByName(payload.name);
    }
    const conversation = await this.conversationPort.findByParticipants(payload.participants || []);
    if (conversation) {
      return conversation;
    }
    return await this.conversationPort.create({
      type: "DM",
      participants: payload.participants || [],
    });
  }
}
