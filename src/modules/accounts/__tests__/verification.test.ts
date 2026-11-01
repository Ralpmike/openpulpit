import { describe, expect, it } from "vitest";

import { saveMyProfile } from "@/modules/accounts/server/profiles";
import { getPublicProfileBySlug } from "@/modules/accounts/server/repo";
import type { Viewer } from "@/modules/accounts/server/session";
import { decideVerification, getVerificationState, requestVerification } from "@/modules/accounts/server/verification";
import { createTestD1, insertUser } from "@/test/d1";

const as = (id: string, role: Viewer["role"]): Viewer => ({ id, name: id, email: `${id}@x.ng`, image: null, role, status: "active", termsVersion: "" });

async function setup() {
  const db = createTestD1();
  insertUser(db, { id: "p1", role: "preacher" });
  insertUser(db, { id: "a1", role: "admin" });
  await saveMyProfile(db, as("p1", "preacher"), {
    displayName: "Rev. Chiamaka Eze", slug: "chiamaka", ministry: "Grace Assembly", state: "Enugu", city: "Enugu", denomination: "", bio: "",
  });
  return db;
}

describe("verification", () => {
  it("goes from request to badge, with an audit record", async () => {
    const db = await setup();
    const { id } = await requestVerification(db, as("p1", "preacher"), "grace.ng");
    expect((await getVerificationState(db, as("p1", "preacher"))).status).toBe("pending");
    await expect(requestVerification(db, as("p1", "preacher"), "")).rejects.toMatchObject({ status: 409 });
    await decideVerification(db, as("a1", "admin"), { id, decision: "approve", reason: "Called the church" });
    expect((await getPublicProfileBySlug(db, "chiamaka"))?.is_verified).toBe(1);
    expect((await getVerificationState(db, as("p1", "preacher"))).status).toBe("verified");
    expect(db.sqlite.prepare("SELECT action, target_id FROM audit_log").all()).toEqual([{ action: "verification.approved", target_id: "p1" }]);
  });

  it("shows the reason after a rejection and allows asking again", async () => {
    const db = await setup();
    const { id } = await requestVerification(db, as("p1", "preacher"), "");
    await decideVerification(db, as("a1", "admin"), { id, decision: "reject", reason: "Add a church link" });
    expect(await getVerificationState(db, as("p1", "preacher"))).toEqual({ status: "rejected", decisionNote: "Add a church link" });
    await expect(requestVerification(db, as("p1", "preacher"), "grace.ng")).resolves.toHaveProperty("id");
  });

  it("refuses preachers without a profile", async () => {
    const db = createTestD1();
    insertUser(db, { id: "p2", role: "preacher" });
    await expect(requestVerification(db, as("p2", "preacher"), "")).rejects.toMatchObject({ status: 409 });
  });
});
