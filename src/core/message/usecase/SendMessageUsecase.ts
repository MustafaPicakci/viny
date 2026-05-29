import NotFoundException from "../../common/exception/NotFoundException.js";
import type ConversationPort from "../../conversation/Conversationport.js";
import type TransportPort from "../../transport/TransportPort.js";
import type UserPort from "../../user/UserPort.js";

import type Message from "../Message.js";
import type MessagePort from "../MessagePort.js";

export interface SendMessageRequest {
  conversationId: number;
  senderId: number;
  text: string;
}

export default class SendMessageUsecase {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly messagePort: MessagePort,
    private readonly userPort: UserPort,
    private readonly transportPort: TransportPort,
  ) {}

  async handle(payload: SendMessageRequest): Promise<Message> {
    const conversation = await this.conversationPort.findById(payload.conversationId);

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
    const sender = await this.userPort.findById(payload.senderId);

    if (!sender) {
      throw new NotFoundException("Sender not found");
    }

    const message = await this.messagePort.create({ conversationId: payload.conversationId, senderId: payload.senderId, text: payload.text, timestamp: new Date() });

    await this.transportPort.transport(
      message,
      conversation.participants.filter((id: number) => id !== payload.senderId),
    );
    return message;
  }
}
