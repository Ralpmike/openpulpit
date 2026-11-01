import { describe, expect, it } from "vitest";

import { createTestD1, insertUser } from "@/test/d1";

function setup() {
  const db = createTestD1();
  insertUser(db, { id: "p1", role: "preacher", name: "Pastor Ade" });
  insertUser(db, { id: "l1", role: "listener" });
  return db;
}

describe("D1 schema", () => {
  it("rejects unknown roles and statuses", () => {
    const db = setup();
    expect(() => insertUser(db, { id: "x", role: "superuser" })).toThrow(/CHECK/);
    expect(() => insertUser(db, { id: "y", status: "deleted" })).toThrow(/CHECK/);
  });

  it("allows only one live broadcast per preacher", () => {
    const db = setup();
    const insert = db.sqlite.prepare(
      "INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES (?, 'p1', 'Sunday Service', 'live', '2026-11-01T09:00:00Z')",
    );
    insert.run("b1");
    expect(() => insert.run("b2")).toThrow(/UNIQUE/);
  });

  it("requires ended_at exactly when a broadcast has ended", () => {
    const db = setup();
    expect(() =>
      db.sqlite
        .prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('b1', 'p1', 'Evening Prayer', 'ended', '2026-11-01T09:00:00Z')")
        .run(),
    ).toThrow(/CHECK/);
  });

  it("keeps the audit log append-only", () => {
    const db = setup();
    db.sqlite
      .prepare("INSERT INTO audit_log (id, actor_id, action, target_type, target_id) VALUES ('a1', 'admin', 'user.suspend', 'user', 'p1')")
      .run();
    expect(() => db.sqlite.prepare("UPDATE audit_log SET reason = 'x'").run()).toThrow(/append-only/);
    expect(() => db.sqlite.prepare("DELETE FROM audit_log").run()).toThrow(/append-only/);
  });

  it("indexes preacher profiles for search and keeps the index in step", () => {
    const db = setup();
    db.sqlite
      .prepare(
        "INSERT INTO preacher_profiles (user_id, slug, display_name, ministry, state, city, denomination) VALUES ('p1', 'pastor-ade', 'Pastor Adebayo Ogunleye', 'Living Word Chapel', 'Oyo', 'Ibadan', 'Pentecostal')",
      )
      .run();
    const search = (q: string) =>
      db.sqlite.prepare("SELECT user_id FROM preacher_search WHERE preacher_search MATCH ?").all(q);
    expect(search("ibadan")).toEqual([{ user_id: "p1" }]);
    expect(search("living")).toHaveLength(1);
    db.sqlite.prepare("UPDATE preacher_profiles SET city = 'Lagos', state = 'Lagos' WHERE user_id = 'p1'").run();
    expect(search("ibadan")).toHaveLength(0);
    expect(search("lagos")).toHaveLength(1);
  });

  it("stops someone following themselves and allows one open report per target", () => {
    const db = setup();
    expect(() =>
      db.sqlite.prepare("INSERT INTO follows (listener_id, preacher_id) VALUES ('p1', 'p1')").run(),
    ).toThrow(/CHECK/);
    const report = db.sqlite.prepare(
      "INSERT INTO reports (id, reporter_id, target_type, target_id, reason) VALUES (?, 'l1', 'profile', 'p1', 'fraud_or_scam')",
    );
    report.run("r1");
    expect(() => report.run("r2")).toThrow(/UNIQUE/);
  });

  it("deletes a user's rows with the user, but keeps their audit history", async () => {
    const db = setup();
    db.sqlite.prepare("INSERT INTO follows (listener_id, preacher_id) VALUES ('l1', 'p1')").run();
    db.sqlite
      .prepare("INSERT INTO audit_log (id, actor_id, action, target_type, target_id) VALUES ('a1', 'admin', 'user.warn', 'user', 'l1')")
      .run();
    db.sqlite.prepare(`DELETE FROM "user" WHERE id = 'l1'`).run();
    expect(await db.prepare("SELECT count(*) AS n FROM follows").first("n")).toBe(0);
    expect(await db.prepare("SELECT count(*) AS n FROM audit_log").first("n")).toBe(1);
  });
});
