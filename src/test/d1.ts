/**
 * A D1Database stand-in for tests: node:sqlite running the real migrations/,
 * so queries and constraints behave as they do on D1.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");

type Params = unknown[];

function toSqlite(value: unknown): SQLInputValue {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value as SQLInputValue;
}

class TestStatement {
  constructor(
    private readonly db: DatabaseSync,
    readonly sql: string,
    readonly params: Params = [],
  ) {}

  bind(...params: Params) {
    return new TestStatement(this.db, this.sql, params);
  }

  private prepared() {
    return this.db.prepare(this.sql);
  }

  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const row = this.prepared().get(...this.params.map(toSqlite)) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async all<T = Record<string, unknown>>() {
    const results = this.prepared().all(...this.params.map(toSqlite)) as T[];
    return { results, success: true, meta: { changes: 0 } };
  }

  async raw<T = unknown[]>() {
    const statement = this.prepared();
    statement.setReturnArrays?.(true);
    return statement.all(...this.params.map(toSqlite)) as T[];
  }

  async run() {
    const info = this.prepared().run(...this.params.map(toSqlite));
    return {
      results: [],
      success: true,
      meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) },
    };
  }
}

export interface TestD1 extends D1Database {
  /** Direct access for assertions. */
  sqlite: DatabaseSync;
}

export function createTestD1(): TestD1 {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
  const db = {
    sqlite,
    prepare: (sql: string) => new TestStatement(sqlite, sql),
    async batch(statements: TestStatement[]) {
      // D1 batches are atomic: all statements land or none do.
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) {
          results.push(/^\s*(select|with)\b/i.test(statement.sql) ? await statement.all() : await statement.run());
        }
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    async exec(sql: string) {
      sqlite.exec(sql);
      return { count: 0, duration: 0 };
    },
    withSession() {
      return db;
    },
    dump() {
      throw new Error("dump is not supported in tests");
    },
  };
  return db as unknown as TestD1;
}

/** Inserts a Better Auth user row with sensible defaults. */
export function insertUser(
  db: TestD1,
  user: { id: string; name?: string; email?: string; role?: string; status?: string },
) {
  const now = new Date().toISOString();
  db.sqlite
    .prepare(
      `INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt, role, status)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
    )
    .run(
      user.id,
      user.name ?? `User ${user.id}`,
      user.email ?? `${user.id}@example.ng`,
      now,
      now,
      user.role ?? "listener",
      user.status ?? "active",
    );
}
