import type User from "../User.js";
import type Userport from "../UserPort.js";

export interface ListUserRequest {}
export type ListUserResponse = { users: Omit<User, "password">[] };

export default class ListUserUsecase {
  constructor(private userport: Userport) {}

  async handle(payload: ListUserRequest): Promise<ListUserResponse> {
    const users = await this.userport.list();
    return { users };
  }
}
