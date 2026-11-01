import { describe, expect, it, vi } from "vitest";

const deleteRoom = vi.fn(async () => undefined);
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));
vi.mock("@/lib/livekit", () => ({ liveKitConfig: () => ({}), roomService: () => ({ deleteRoom, listParticipants: async () => [] }) }));

import { CURRENT_TERMS_VERSION, type Viewer } from "@/modules/accounts";
import { runAdminAction } from "@/modules/admin/server/moderation";
import { listAuditLog, listOpenReportGroups } from "@/modules/admin/server/queues";
import { createReport } from "@/modules/moderation/server/reports";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";
import { seedPreacher, seedRecording } from "@/test/seed";

const admin: Viewer = { id: "a1", name: "Admin", email: "a@x.ng", image: null, role: "admin", status: "active", termsVersion: CURRENT_TERMS_VERSION };
const listener = (id: string): Viewer => ({ ...admin, id, role: "listener" });

function setup() {
  const env = createTestEnv();
  const db = env.DB;
  insertUser(db, { id: "a1", role: "admin", name: "Admin" });
  for (const id of ["l1", "l2"]) insertUser(db, { id });
  seedPreacher(db, "p1");
  seedRecording(db, "r1", "p1");
  db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('live1', 'p1', 'Live now', 'live', '2026-11-01T09:00:00Z')").run();
  db.sqlite.prepare("INSERT INTO recordings (id, broadcast_id, preacher_id, title, r2_key) VALUES ('rlive', 'live1', 'p1', 'Live now', 'k')").run();
  return env;
}
const audit = (env: ReturnType<typeof setup>) => env.DB.sqlite.prepare("SELECT action, target_type, target_id, reason FROM audit_log").all();

describe("admin moderation", () => {
  it("groups open reports by target, most reported first", async () => {
    const env = setup();
    await createReport(env.DB, listener("l1"), { targetType: "recording", targetId: "r1", reason: "fraud_or_scam", details: "seed money" });
    await createReport(env.DB, listener("l2"), { targetType: "recording", targetId: "r1", reason: "hate_speech", details: "" });
    await createReport(env.DB, listener("l1"), { targetType: "broadcast", targetId: "live1", reason: "violence", details: "" });
    const groups = await listOpenReportGroups(env.DB);
    expect(groups.map((g) => [g.targetType, g.targetId, g.reportCount])).toEqual([
      ["recording", "r1", 2],
      ["broadcast", "live1", 1],
    ]);
    expect(groups[0]).toMatchObject({ title: "Sermon r1", latestDetails: "seed money", link: "/r/r1", state: "ready:public" });
  });

  it("ends a live broadcast: ended by admin, recording hidden, room deleted, reports actioned, audited", async () => {
    const env = setup();
    await createReport(env.DB, listener("l1"), { targetType: "broadcast", targetId: "live1", reason: "violence", details: "" });
    await runAdminAction(env, admin, { action: "end_broadcast", targetId: "live1", reason: "Incitement in the first 10 minutes" });
    expect(env.DB.sqlite.prepare("SELECT status, ended_reason FROM broadcasts WHERE id = 'live1'").get()).toEqual({ status: "ended", ended_reason: "admin" });
    expect(env.DB.sqlite.prepare("SELECT visibility FROM recordings WHERE id = 'rlive'").get()).toEqual({ visibility: "hidden_by_admin" });
    expect(deleteRoom).toHaveBeenCalledWith("live1");
    expect(env.DB.sqlite.prepare("SELECT status, resolved_by FROM reports").get()).toEqual({ status: "actioned", resolved_by: "a1" });
    expect(audit(env)).toEqual([{ action: "end_broadcast", target_type: "broadcast", target_id: "live1", reason: "Incitement in the first 10 minutes" }]);
    await expect(runAdminAction(env, admin, { action: "end_broadcast", targetId: "live1", reason: "again" })).rejects.toMatchObject({ status: 409 });
  });

  it("hides and restores a recording, each audited", async () => {
    const env = setup();
    await runAdminAction(env, admin, { action: "hide_recording", targetId: "r1", reason: "Copyrighted music" });
    expect(env.DB.sqlite.prepare("SELECT visibility FROM recordings WHERE id = 'r1'").get()).toEqual({ visibility: "hidden_by_admin" });
    await runAdminAction(env, admin, { action: "unhide_recording", targetId: "r1", reason: "Music was licensed" });
    expect(audit(env)).toHaveLength(2);
  });

  it("suspends a preacher: signed out, live broadcast ended, audited; can't moderate admins", async () => {
    const env = setup();
    env.DB.sqlite.prepare(`INSERT INTO session (id, expiresAt, token, createdAt, updatedAt, userId) VALUES ('s1', '2030-01-01', 't1', '2026-01-01', '2026-01-01', 'p1')`).run();
    await runAdminAction(env, admin, { action: "suspend_user", targetId: "p1", reason: "Repeated scams" });
    expect(env.DB.sqlite.prepare(`SELECT status FROM "user" WHERE id = 'p1'`).get()).toEqual({ status: "suspended" });
    expect(env.DB.sqlite.prepare("SELECT count(*) AS n FROM session WHERE userId = 'p1'").get()).toEqual({ n: 0 });
    expect(env.DB.sqlite.prepare("SELECT status FROM broadcasts WHERE id = 'live1'").get()).toEqual({ status: "ended" });
    await expect(runAdminAction(env, admin, { action: "ban_user", targetId: "a1", reason: "nope" })).rejects.toMatchObject({ status: 400 });
    const log = await listAuditLog(env.DB);
    expect(log[0]).toMatchObject({ actorName: "Admin", action: "suspend_user", targetId: "p1" });
  });

  it("dismisses reports without changing the content", async () => {
    const env = setup();
    await createReport(env.DB, listener("l1"), { targetType: "profile", targetId: "pastor-p1", reason: "other", details: "I disagree with his doctrine" });
    await runAdminAction(env, admin, { action: "dismiss_reports", targetId: "profile:p1", reason: "Doctrine is not policed" });
    expect(env.DB.sqlite.prepare("SELECT status FROM reports").get()).toEqual({ status: "dismissed" });
    expect(env.DB.sqlite.prepare(`SELECT status FROM "user" WHERE id = 'p1'`).get()).toEqual({ status: "active" });
    expect(await listOpenReportGroups(env.DB)).toEqual([]);
  });
});
