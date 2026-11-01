import { describe, expect, it } from "vitest";

import type { Viewer } from "@/modules/accounts/server/session";
import { applyToPreach, chooseToPreach, decideApplication } from "@/modules/accounts/server/service";
import { createTestD1, insertUser } from "@/test/d1";

const viewer = (id: string, role: Viewer["role"] = "listener"): Viewer => ({
  id, name: id, email: `${id}@example.ng`, image: null, role, status: "active", termsVersion: "",
});

describe("accounts service", () => {
  it("lets a listener apply once, and an admin approval makes them a preacher with an audit record", async () => {
    const db = createTestD1();
    insertUser(db, { id: "l1" });
    insertUser(db, { id: "admin", role: "admin" });
    const { id } = await applyToPreach(db, viewer("l1"), { ministry: "Grace Chapel", note: "" });
    await expect(applyToPreach(db, viewer("l1"), { ministry: "Grace Chapel", note: "" })).rejects.toMatchObject({ status: 409 });
    await decideApplication(db, viewer("admin", "admin"), { id, decision: "approve", reason: "Known ministry" });
    expect(db.sqlite.prepare(`SELECT role FROM "user" WHERE id = 'l1'`).get()).toEqual({ role: "preacher" });
    expect(db.sqlite.prepare("SELECT action, target_id FROM audit_log").all()).toEqual([
      { action: "preacher_application.approved", target_id: "l1" },
    ]);
    await expect(decideApplication(db, viewer("admin", "admin"), { id, decision: "reject", reason: "" })).rejects.toMatchObject({ status: 409 });
  });

  it("rejecting keeps the listener role", async () => {
    const db = createTestD1();
    insertUser(db, { id: "l1" });
    const { id } = await applyToPreach(db, viewer("l1"), { ministry: "Grace Chapel", note: "" });
    await decideApplication(db, viewer("admin", "admin"), { id, decision: "reject", reason: "" });
    expect(db.sqlite.prepare(`SELECT role FROM "user" WHERE id = 'l1'`).get()).toEqual({ role: "listener" });
  });

  it("lets a brand-new account choose to preach, but not an old one", async () => {
    const db = createTestD1();
    insertUser(db, { id: "new" });
    await chooseToPreach(db, viewer("new"));
    expect(db.sqlite.prepare(`SELECT role FROM "user" WHERE id = 'new'`).get()).toEqual({ role: "preacher" });
    insertUser(db, { id: "old" });
    db.sqlite.prepare(`UPDATE "user" SET createdAt = '2026-01-01T00:00:00.000Z' WHERE id = 'old'`).run();
    await expect(chooseToPreach(db, viewer("old"))).rejects.toMatchObject({ status: 403 });
  });
});
