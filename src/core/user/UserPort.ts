import type User from "./User.js";

export default interface UserPort {
  create(payload: Omit<User, "id">): Promise<User>;
  findByUsername(username: string): Promise<User>;
  findById(id: number): Promise<User>;
  list(): Promise<User[]>;
  search({ query, limit }: { query: string; limit?: number }): Promise<Omit<User, "password">[]>;
}
