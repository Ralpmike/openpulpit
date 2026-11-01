import { describe, expect, it } from "vitest";

import { CURRENT_TERMS_VERSION, type Viewer } from "@/modules/accounts";
import { reportSchema } from "@/modules/moderation/schemas/report";
import { createReport } from "@/modules/moderation/server/reports";
import { createTestD1, insertUser } from "@/test/d1";
import { seedPreacher, seedRecording } from "@/test/seed";

const listener: Viewer = { id: "l1", name: "N", email: "n@x.ng", image: null, role: "listener", status: "active", termsVersion: CURRENT_TERMS_VERSION };

function setup() {
  const db = createTestD1();
  seedPreacher(db, "p1");
  seedRecording(db, "r1", "p1");
  insertUser(db, { id: "l1" });
  return db;
}

describe("reports", () => {
  it("reports a recording, a broadcast and a profile, once each while open", async () => {
    const db = setup();
    await createReport(db, listener, { targetType: "recording", targetId: "r1", reason: "fraud_or_scam", details: "Asked for seed money" });
    await createReport(db, listener, { targetType: "broadcast", targetId: "b-r1", reason: "hate_speech", details: "" });
    await createReport(db, listener, { targetType: "profile", targetId: "pastor-p1", reason: "harassment", details: "" });
    await expect(createReport(db, listener, { targetType: "recording", targetId: "r1", reason: "other", details: "again" })).rejects.toMatchObject({ status: 409 });
    expect(db.sqlite.prepare("SELECT target_type, target_id FROM reports ORDER BY target_type").all()).toEqual([
      { target_type: "broadcast", target_id: "b-r1" },
      { target_type: "profile", target_id: "p1" },
      { target_type: "recording", target_id: "r1" },
    ]);
  });

  it("refuses unknown targets, your own content, and people who haven't accepted the terms", async () => {
    const db = setup();
    await expect(createReport(db, listener, { targetType: "recording", targetId: "nope", reason: "illegal", details: "" })).rejects.toMatchObject({ status: 404 });
    await expect(createReport(db, { ...listener, id: "p1", role: "preacher" }, { targetType: "recording", targetId: "r1", reason: "illegal", details: "" })).rejects.toMatchObject({ status: 409 });
    await expect(createReport(db, { ...listener, termsVersion: "" }, { targetType: "recording", targetId: "r1", reason: "illegal", details: "" })).rejects.toMatchObject({ status: 403 });
  });

  it("needs a reason, and details when the reason is 'other'", () => {
    expect(reportSchema.safeParse({ targetType: "recording", targetId: "r1" }).success).toBe(false);
    expect(reportSchema.safeParse({ targetType: "recording", targetId: "r1", reason: "other", details: "" }).success).toBe(false);
    expect(reportSchema.safeParse({ targetType: "recording", targetId: "r1", reason: "other", details: "Plays copyrighted music" }).success).toBe(true);
  });
});
