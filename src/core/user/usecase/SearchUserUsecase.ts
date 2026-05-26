import type { AuthenticatedUsecaseInput } from "../../common/Usecase.js";
import type User from "../User.js";
import type UserPort from "../UserPort.js";

export interface SearchUserUsecasePayload extends AuthenticatedUsecaseInput {
  query: string;
  limit?: number;
}
export type SearchUserResponse = { users: Omit<User, "password">[] };

export default class SearchUserUsecase {
  constructor(private userport: UserPort) {}

  async handle(payload: SearchUserUsecasePayload): Promise<SearchUserResponse> {
    const users = await this.userport.search(payload);
    return { users: users.filter((u) => u.id !== payload.requestedBy) };
  }
}
