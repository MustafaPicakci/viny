import NotFoundException from "../../common/exception/NotFoundException.js";
import type { AuthenticatedUsecaseInput } from "../../common/Usecase.js";
import type ConversationPort from "../../conversation/Conversationport.js";
import type TransportPort from "../../transport/TransportPort.js";
import type UserPort from "../../user/UserPort.js";

import type Message from "../Message.js";
import type MessagePort from "../MessagePort.js";

export interface SendMessageRequest extends AuthenticatedUsecaseInput {
  conversationId: number;
  senderId: number;
  text: string;
}
export interface SendMessageResponse extends Message {
  conversationName: string;
  senderUsername?: string;
}

export default class SendMessageUsecase {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly messagePort: MessagePort,
    private readonly userPort: UserPort,
    private readonly transportPort: TransportPort,
  ) {}

  async handle(payload: SendMessageRequest): Promise<SendMessageResponse> {
    const conversation = await this.conversationPort.findById(payload.conversationId);

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
    const sender = await this.userPort.findById(payload.senderId);

    if (!sender) {
      throw new NotFoundException("Sender not found");
    }

    const message = await this.messagePort.create({ conversationId: payload.conversationId, senderId: payload.senderId, text: payload.text, timestamp: new Date() });

    const conversationName = conversation.type === "GROUP" ? conversation.name! : sender.username;
    const response: SendMessageResponse = { ...message, conversationName, senderUsername: sender.username };

    await this.transportPort.transport(
      response,
      conversation.participants.filter((id: number) => id !== payload.senderId),
    );
    return response;
  }
}
