import type { Database } from "better-sqlite3";

import type { Host } from "../Entity/Host.js";
import type { Repository } from "./BaseRepository.js";

export class HostRepository implements Repository<Host> {
  constructor(private db: Database) {}
  findById(id: number): Host {
    return this.db.prepare("SELECT * FROM hosts WHERE id = ?").get(id) as Host;
  }
  findAll(): Host[] {
    return this.db.prepare("SELECT * FROM hosts").all() as Host[];
  }
  create(payload: Omit<Host, "id" | "createdAt">): Host {
    const id = this.db.prepare("INSERT INTO hosts (port) VALUES (?)").run(payload.port);
    return this.findById(id.lastInsertRowid as number) as Host;
  }
  delete(id: number): boolean {
    return this.db.prepare("DELETE FROM hosts WHERE id = ?").run(id).changes > 0;
  }
}
