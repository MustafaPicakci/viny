import knex, { Knex } from "knex";

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    host: "127.0.0.1",
    filename: "~/.viny/viny.db",
  },
  migrations: {
    directory: "./migrations",
  },
};

const db = knex(config);

db.schema.createTableIfNotExists("users", (table) => {
  table.increments("id").primary();
  table.string("username").notNullable().unique();
  table.string("passwordHash").notNullable();
});

db.schema.createTableIfNotExists("conversations", (table) => {
  table.increments("id").primary();
  table.string("name").nullable();
  table.json("participants").notNullable();
});

db.schema.createTableIfNotExists("messages", (table) => {
  table.increments("id").primary();
  table.integer("conversationId").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
  table.integer("senderId").notNullable().references("id").inTable("users").onDelete("CASCADE");
  table.text("text").notNullable();
  table.timestamp("timestamp").defaultTo(db.fn.now());
});

export default db;
export type Db = typeof db;
