const sql = require("better-sqlite3");

const db = sql("dir.db");

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS directory (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       parent INTEGER,
       ancestors TEXT NOT NULL
    )
`
).run();

db.prepare("INSERT INTO directory (name, parent, ancestors) VALUES (?, ?, ?)").run("root", null, JSON.stringify([]));
