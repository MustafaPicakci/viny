import Database from "better-sqlite3";

export const db = new Database("./database.sqlite", { verbose: console.log });

init();
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

function init() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS hosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  port INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  ).run();
}
