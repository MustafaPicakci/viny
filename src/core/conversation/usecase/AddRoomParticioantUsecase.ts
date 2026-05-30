import NotFoundException from "../../common/exception/NotFoundException.js";
import UnauthorizedException from "../../common/exception/UnauthorizedException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type UserPort from "../../user/UserPort.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface AddRoomParticipantUsecaseInput extends AuthenticatedUsecaseInput {
  conversationId: number;
  username: string;
}

export default class AddRoomParticipantUsecase implements Usecase<AddRoomParticipantUsecaseInput, Conversation> {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly userPort: UserPort,
  ) {}

  async handle(input: AddRoomParticipantUsecaseInput): Promise<Conversation> {
    const conversation = await this.conversationPort.findById(input.conversationId);
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.type !== "GROUP") {
      throw new UnauthorizedException("Only group conversations can be joined");
    }
    const user = await this.userPort.findByUsername(input.username);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    //!bu threadsafe değil! bir ara bak
    await this.conversationPort.addParticipant(conversation.id, input.requestedBy);
    return conversation;
  }
}
