import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface CreateRoomUsecaseInput extends AuthenticatedUsecaseInput {
  name: string;
}

export default class CreateRoomUsecase implements Usecase<CreateRoomUsecaseInput, Conversation> {
  constructor(private readonly conversationPort: ConversationPort) {}

  async handle(input: CreateRoomUsecaseInput): Promise<Conversation> {
    return this.conversationPort.create({
      type: "GROUP",
      //   conversationKey: `room:${randomUUID()}`,
      name: input.name,
      participants: [input.requestedBy],
    });
  }
}
