import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface ListConversationsUsecaseInput extends AuthenticatedUsecaseInput {}

export default class ListConversationsUsecase implements Usecase<ListConversationsUsecaseInput, Conversation[]> {
  constructor(private readonly conversationPort: ConversationPort) {}

  async handle(input: ListConversationsUsecaseInput): Promise<Conversation[]> {
    return this.conversationPort.listForUser(input.requestedBy);
  }
}
