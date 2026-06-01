import NotFoundException from "../../common/exception/NotFoundException.js";
import UnauthorizedException from "../../common/exception/UnauthorizedException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type UserPort from "../../user/UserPort.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface AddRoomParticipantUsecaseInput extends AuthenticatedUsecaseInput {
  name: string; //fake room name
  username: string;
}

export default class AddRoomParticipantUsecase implements Usecase<AddRoomParticipantUsecaseInput, Conversation> {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly userPort: UserPort,
  ) {}

  async handle(input: AddRoomParticipantUsecaseInput): Promise<Conversation> {
    const { requestedBy } = input;
    const conversation = await this.conversationPort.findByName(input.name);
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.type !== "GROUP" || conversation.participants?.[0]?.toString() !== requestedBy.toString()) {
      throw new UnauthorizedException("You are not able to add participants to this conversation");
    }
    const user = await this.userPort.findByUsername(input.username);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    //!bu threadsafe değil! bir ara bak
    await this.conversationPort.addParticipant(conversation.id, user.id);
    return conversation;
  }
}
