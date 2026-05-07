import type { EntityType } from "./BaseEntity.js";

export class Host implements EntityType {
  readonly id: number;
  readonly createdAt: Date;
  readonly name: string;
  readonly port: number;
  readonly ownerId: number;

  constructor(payload: Host) {
    this.id = payload.id;
    this.createdAt = payload.createdAt;
    this.name = payload.name;
    this.port = payload.port;
    this.ownerId = payload.ownerId;
  }
}
