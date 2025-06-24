import sql from "better-sqlite3";
import { fakerKO as faker } from "@faker-js/faker";

let db: sql.Database | null = null;

const getDatabase = () => {
  if (!db) {
    db = sql(":memory:");

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

    db.prepare("INSERT INTO directory (name, parent, ancestors) VALUES (?, ?, ?)").run(
      "root",
      null,
      JSON.stringify([])
    );
  }
  return db;
};

export const getDir = async (id: ID): Promise<Dir> => {
  const database = getDatabase();

  const dir = database.prepare("SELECT * FROM directory WHERE id = ?").get(id) as DirModel | undefined; // 데이터 가져오기
  if (!dir) {
    throw new Error("Directory not found");
  }

  let children = database.prepare("SELECT * FROM directory WHERE parent = ?").all(id) as DirModel[];
  if (children.length === 0) {
    for (let i = 0; i < 10; i++) {
      const randomName = faker.internet.emoji() + " " + faker.word.noun();

      const result = database
        .prepare("INSERT INTO directory (name, parent, ancestors) VALUES (?, ?, ?)")
        .run(randomName, id, JSON.stringify([...JSON.parse(dir.ancestors), { id: dir.id, name: dir.name }]));

      children.push({
        id: result.lastInsertRowid,
        name: randomName,
        parent: id,
        ancestors: JSON.stringify([...JSON.parse(dir.ancestors), { id: dir.id, name: dir.name }]),
      });
    }
  }

  return {
    id: dir.id,
    name: dir.name,
    parent: dir.parent,
    ancestors: JSON.parse(dir.ancestors),
    children,
  };
};
