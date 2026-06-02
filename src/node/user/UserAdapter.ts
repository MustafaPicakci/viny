import type User from "../../core/user/User.js";
import type UserPort from "../../core/user/UserPort.js";

import type { Db } from "../db/Db.js";

export default class UserAdapter implements UserPort {
  constructor(private readonly db: Db) {}
  search({ query, limit }: { query: string; limit?: number }): Promise<Omit<User, "password">[]> {
    let q = this.db("users").where("username", "like", `%${query}%`).select("id", "username");
    if (limit) {
      q = q.limit(limit);
    }
    return q as Promise<Omit<User, "password">[]>;
  }
  async create(user: User): Promise<User> {
    const [row] = await this.db("users").insert(user).returning("id");
    const id = typeof row === "object" ? row.id : row;
    return { ...user, id } as User;
  }
  async findByUsername(username: string): Promise<User> {
    return this.db("users").where({ username }).first() as Promise<User>;
  }
  async findById(id: number): Promise<User> {
    return this.db("users").where({ id }).first() as Promise<User>;
  }
  async list(): Promise<User[]> {
    return this.db("users").select();
  }
}
