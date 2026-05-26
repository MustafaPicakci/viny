import knex, { type Knex } from "knex";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dbDir = path.join(os.homedir(), ".viny");
fs.mkdirSync(dbDir, { recursive: true });

const config: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: path.join(dbDir, "viny.db"),
  },
  useNullAsDefault: true,
  migrations: {
    directory: "./migrations",
  },
};

const db = knex(config);

async function initSchema() {
  if (!(await db.schema.hasTable("users"))) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("username").notNullable().unique();
      table.string("password").notNullable();
    });
  }

  if (!(await db.schema.hasTable("conversations"))) {
    await db.schema.createTable("conversations", (table) => {
      table.increments("id").primary();
      table.string("name").nullable();
      table.json("participants").notNullable();
    });
  }

  if (!(await db.schema.hasTable("messages"))) {
    await db.schema.createTable("messages", (table) => {
      table.increments("id").primary();
      table.integer("conversationId").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
      table.integer("senderId").notNullable().references("id").inTable("users").onDelete("CASCADE");
      table.text("text").notNullable();
      table.timestamp("timestamp").defaultTo(db.fn.now());
    });
  }
}

await initSchema();

export default db;
export type Db = typeof db;
