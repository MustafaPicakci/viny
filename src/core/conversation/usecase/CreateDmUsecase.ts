import NotFoundException from "../../common/exception/NotFoundException.js";
import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type UserPort from "../../user/UserPort.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface CreateDMUsecaseInput extends AuthenticatedUsecaseInput {
  peerUserId: number;
}

export default class CreateDMUsecase implements Usecase<CreateDMUsecaseInput, Conversation> {
  constructor(
    private readonly userPort: UserPort,
    private readonly conversationPort: ConversationPort,
  ) {}

  async handle(input: CreateDMUsecaseInput): Promise<Conversation> {
    const peer = await this.userPort.findById(input.peerUserId);
    if (!peer) {
      throw new NotFoundException("Peer user not found");
    }

    // const key = buildDmConversationKey(input.requestedBy.id, peer.id);
    const existing = await this.conversationPort.findByParticipants([input.requestedBy, peer.id]);
    if (existing) {
      return existing;
    }

    return this.conversationPort.create({
      type: "DM",
      participants: [input.requestedBy, peer.id],
    });
  }
}
