import { describe, expect, it } from "vitest";

import { listSuggestedPreachers } from "@/modules/accounts/server/suggestions";
import { listLiveNow } from "@/modules/broadcasting/server/feeds";
import { listPreacherRecordings, listRecentRecordings } from "@/modules/library/server/queries";
import { createTestD1, insertUser } from "@/test/d1";
import { seedPreacher, seedRecording } from "@/test/seed";

function setup() {
  const db = createTestD1();
  seedPreacher(db, "p1", { isVerified: true });
  seedPreacher(db, "p2");
  seedPreacher(db, "p3", { status: "suspended" });
  seedRecording(db, "r1", "p1", { createdAt: "2026-11-01T10:00:00.000Z" });
  seedRecording(db, "r2", "p2", { createdAt: "2026-11-02T10:00:00.000Z" });
  seedRecording(db, "r3", "p1", { visibility: "hidden_by_preacher" });
  seedRecording(db, "r4", "p1", { visibility: "hidden_by_admin" });
  seedRecording(db, "r5", "p1", { status: "processing" });
  seedRecording(db, "r6", "p3");
  return db;
}

describe("home page queries", () => {
  it("lists only ready, public recordings of preachers in good standing, newest first", async () => {
    const db = setup();
    expect((await listRecentRecordings(db)).map((r) => r.id)).toEqual(["r2", "r1"]);
    expect((await listPreacherRecordings(db, "p1")).map((r) => r.id)).toEqual(["r1"]);
    expect(await listPreacherRecordings(db, "p3")).toEqual([]);
  });

  it("pages recent recordings with a cursor", async () => {
    const db = setup();
    expect((await listRecentRecordings(db, { before: "2026-11-02T10:00:00.000Z" })).map((r) => r.id)).toEqual(["r1"]);
  });

  it("lists live broadcasts, not suspended preachers'", async () => {
    const db = setup();
    db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('live1', 'p2', 'Evening Prayer', 'live', '2026-11-03T18:00:00Z')").run();
    db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('live2', 'p3', 'Hidden', 'live', '2026-11-03T18:00:00Z')").run();
    expect((await listLiveNow(db)).map((b) => b.id)).toEqual(["live1"]);
  });

  it("suggests verified preachers first and leaves out ones already followed", async () => {
    const db = setup();
    insertUser(db, { id: "l1" });
    expect((await listSuggestedPreachers(db)).map((p) => p.slug)).toEqual(["pastor-p1", "pastor-p2"]);
    db.sqlite.prepare("INSERT INTO follows (listener_id, preacher_id) VALUES ('l1', 'p1')").run();
    expect((await listSuggestedPreachers(db, { viewerId: "l1" })).map((p) => p.slug)).toEqual(["pastor-p2"]);
  });
});
