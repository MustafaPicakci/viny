import NotFoundException from "../../common/exception/NotFoundException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type ConversationPort from "../../conversation/Conversationport.js";
import type Message from "../Message.js";
import type MessagePort from "../MessagePort.js";

export interface FetchMessagesUsecaseInput extends AuthenticatedUsecaseInput {
  conversationId: number;
}

export default class FetchMessagesUsecase implements Usecase<FetchMessagesUsecaseInput, Message[]> {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly messagePort: MessagePort,
  ) {}

  async handle(input: FetchMessagesUsecaseInput): Promise<Message[]> {
    const conversation = await this.conversationPort.findById(input.conversationId);
    if (!conversation) throw new NotFoundException("Conversation not found");

    return this.messagePort.findByConversationId(conversation.id);
  }
}
