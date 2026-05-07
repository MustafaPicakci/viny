import type { EntityType } from "./BaseEntity.js";

export class User implements EntityType {
  readonly id: number;
  readonly createdAt: Date;
  readonly username: string;
  readonly password: string;

  constructor(payload: User) {
    this.id = payload.id;
    this.createdAt = payload.createdAt;
    this.username = payload.username;
    this.password = payload.password;
  }
}
