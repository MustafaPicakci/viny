import NotFoundException from "../../common/exception/NotFoundException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type User from "../../user/User.js";
import type UserPort from "../../user/UserPort.js";
import type ConversationPort from "../Conversationport.js";

export interface GetRoomParticipantsUsecaseInput extends AuthenticatedUsecaseInput {
  name: string;
}

export default class GetRoomParticipantsUsecase implements Usecase<GetRoomParticipantsUsecaseInput, Pick<User, "id" | "username">[]> {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly userPort: UserPort,
  ) {}

  async handle(input: GetRoomParticipantsUsecaseInput): Promise<Pick<User, "id" | "username">[]> {
    const conversation = await this.conversationPort.findByName(input.name);
    if (!conversation) throw new NotFoundException("Conversation not found");
    const users = await Promise.all(conversation.participants.map((id) => this.userPort.findById(id as number)));
    return users.map((u) => ({ id: u.id, username: u.username }));
  }
}
