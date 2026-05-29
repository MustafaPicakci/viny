import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface FindOrCreateConversationRequest {
  participants?: string[];
  name?: string;
}

export default class FindOrCreateConversationUsecase {
  constructor(private conversationPort: ConversationPort) {}

  async handle(payload: FindOrCreateConversationRequest): Promise<Conversation> {
    if (payload.name) {
      return await this.conversationPort.findByName(payload.name);
    }
    return await this.conversationPort.findByParticipants(payload.participants || []);
  }
}
