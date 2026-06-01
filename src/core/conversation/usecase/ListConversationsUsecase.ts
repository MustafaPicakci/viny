import type { AuthenticatedUsecaseInput, Usecase } from "../../common/Usecase.js";
import type UserPort from "../../user/UserPort.js";
import type Conversation from "../Conversation.js";
import type ConversationPort from "../Conversationport.js";

export interface ListConversationsUsecaseInput extends AuthenticatedUsecaseInput {}

export interface SendMessageResponse extends Conversation {
  peerUsername: string;
}
export default class ListConversationsUsecase implements Usecase<ListConversationsUsecaseInput, Conversation[]> {
  constructor(
    private readonly conversationPort: ConversationPort,
    private readonly userPort: UserPort,
  ) {}

  async handle(input: ListConversationsUsecaseInput): Promise<Conversation[]> {
    const conversations = await this.conversationPort.listForUser(input.requestedBy);

    const enrichedConversations = await Promise.all(
      conversations.map(async (c) => {
        if (c.type === "DM") {
          const peerId = c.participants.find((p) => p !== input.requestedBy);
          if (peerId) {
            const peer = await this.userPort.findById(peerId);

            return { ...c, name: peer.username };
          } else {
            return { ...c, name: "Deleted User" };
          }
        }
        return c;
      }),
    );
    return enrichedConversations;
  }
}
