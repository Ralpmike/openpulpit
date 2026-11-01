import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));

import { enforceRecordingLimit, getRecordingLimitStatus, recordingsOverLimit } from "@/modules/library/server/retention";
import { createTestEnv } from "@/test/env";
import { seedPreacher, seedRecording } from "@/test/seed";

function setup(count: number) {
  const deleted: string[] = [];
  const env = createTestEnv({ FREE_RECORDING_LIMIT: "3" });
  (env as { RECORDINGS: R2Bucket }).RECORDINGS = { delete: async (key: string) => void deleted.push(key) } as unknown as R2Bucket;
  seedPreacher(env.DB, "p1");
  for (let i = 1; i <= count; i++) {
    seedRecording(env.DB, `r${i}`, "p1", {
      createdAt: `2026-10-${String(i).padStart(2, "0")}T10:00:00.000Z`,
      visibility: i === 2 ? "hidden_by_preacher" : "public",
    });
  }
  return { env, deleted };
}

describe("free-tier recording limit", () => {
  it("keeps the newest N, counting hidden ones, and deletes the rest (row then file)", async () => {
    const { env, deleted } = setup(5);
    expect(await enforceRecordingLimit(env, "p1")).toEqual(["r2", "r1"]);
    expect(deleted).toEqual(["recordings/p1/b-r2.ogg", "recordings/p1/b-r1.ogg"]);
    const statuses = env.DB.sqlite.prepare("SELECT id, status FROM recordings ORDER BY id").all();
    expect(statuses).toEqual([
      { id: "r1", status: "deleted" },
      { id: "r2", status: "deleted" },
      { id: "r3", status: "ready" },
      { id: "r4", status: "ready" },
      { id: "r5", status: "ready" },
    ]);
    expect(await enforceRecordingLimit(env, "p1")).toEqual([]);
  });

  it("says which sermon the next broadcast will push out", async () => {
    const { env } = setup(3);
    expect(await getRecordingLimitStatus(env.DB, "p1", 3)).toEqual({ limit: 3, count: 3, nextToGo: { id: "r1", title: "Sermon r1" } });
    expect((await getRecordingLimitStatus(env.DB, "p1", 4)).nextToGo).toBeNull();
  });

  it("is a pure slice", () => {
    expect(recordingsOverLimit([1, 2, 3, 4], 2)).toEqual([3, 4]);
    expect(recordingsOverLimit([1], 20)).toEqual([]);
  });
});
