import { describe, expect, it, vi } from "vitest";

import type { Viewer } from "@/modules/accounts";
import { deleteMyRecording, listMyRecordings, setMyRecordingHidden, updateMyRecording } from "@/modules/library/server/manage";
import { listRecentRecordings } from "@/modules/library/server/queries";
import { createTestD1 } from "@/test/d1";
import { seedPreacher, seedRecording } from "@/test/seed";

const p1: Viewer = { id: "p1", name: "Ade", email: "a@x.ng", image: null, role: "preacher", status: "active", termsVersion: "" };
const p2: Viewer = { ...p1, id: "p2" };

function setup() {
  const db = createTestD1();
  seedPreacher(db, "p1");
  seedPreacher(db, "p2");
  seedRecording(db, "r1", "p1");
  seedRecording(db, "r2", "p1", { visibility: "hidden_by_admin" });
  return db;
}

describe("managing recordings", () => {
  it("renames and re-describes only your own recordings", async () => {
    const db = setup();
    await updateMyRecording(db, p1, "r1", { title: "Walking in Faith", description: "Part 1", biblePassage: "Hebrews 11" });
    expect((await listMyRecordings(db, p1)).find((r) => r.id === "r1")).toMatchObject({ title: "Walking in Faith", biblePassage: "Hebrews 11" });
    await expect(updateMyRecording(db, p2, "r1", { title: "Mine now", description: "", biblePassage: "" })).rejects.toMatchObject({ status: 404 });
  });

  it("hides and unhides, but never undoes an admin's hide", async () => {
    const db = setup();
    expect(await setMyRecordingHidden(db, p1, "r1", true)).toBe("hidden_by_preacher");
    expect(await listRecentRecordings(db)).toEqual([]);
    expect(await setMyRecordingHidden(db, p1, "r1", false)).toBe("public");
    await expect(setMyRecordingHidden(db, p1, "r2", false)).rejects.toMatchObject({ status: 403 });
  });

  it("deletes the row first, then the file; others can't delete it", async () => {
    const db = setup();
    const bucket = { delete: vi.fn(async () => {}) } as unknown as R2Bucket;
    await expect(deleteMyRecording(db, bucket, p2, "r1")).rejects.toMatchObject({ status: 404 });
    await deleteMyRecording(db, bucket, p1, "r1");
    expect(bucket.delete).toHaveBeenCalledWith("recordings/p1/b-r1.ogg");
    expect((await listMyRecordings(db, p1)).map((r) => r.id)).toEqual(["r2"]);
    await expect(deleteMyRecording(db, bucket, p1, "r1")).rejects.toMatchObject({ status: 404 });
  });
});
