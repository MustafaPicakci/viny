import NotFoundException from "../../common/exception/NotFoundException.js";
import UnauthorizedException from "../../common/exception/UnauthorizedException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface JoinRoomUsecaseInput extends AuthenticatedUsecaseInput {
  conversationId: number;
}

export default class JoinRoomUsecase implements Usecase<JoinRoomUsecaseInput, Conversation> {
  constructor(private readonly conversationPort: ConversationPort) {}

  async handle(input: JoinRoomUsecaseInput): Promise<Conversation> {
    const conversation = await this.conversationPort.findById(input.conversationId);
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.type !== "GROUP") {
      throw new UnauthorizedException("Only group conversations can be joined");
    }
    //!bu threadsafe değil! bir ara bak
    await this.conversationPort.addParticipant(conversation.id, input.requestedBy);
    return conversation;
  }
}
