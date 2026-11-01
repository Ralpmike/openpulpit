/** Regressions for the pre-merge review findings. */
import { describe, expect, it, vi } from "vitest";

const participants = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));
vi.mock("@/lib/livekit", () => ({
  liveKitConfig: () => ({}),
  roomService: () => ({ listParticipants: participants, deleteRoom: async () => {} }),
  egressClient: () => ({}),
}));

import { CURRENT_TERMS_VERSION, type Viewer } from "@/modules/accounts";
import { ownAvatarKey, saveMyAccountPhoto } from "@/modules/accounts/server/account";
import { runAdminAction } from "@/modules/admin/server/moderation";
import { markLive, syncBroadcast } from "@/modules/broadcasting/server/lifecycle";
import { getBroadcastWithPreacher } from "@/modules/broadcasting/server/queries";
import { deleteMyRecording } from "@/modules/library/server/manage";
import { stopRecording } from "@/modules/library/server/recording";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";
import { seedPreacher } from "@/test/seed";

const viewer = (id: string, role: Viewer["role"] = "listener", image: string | null = null): Viewer => ({
  id, name: id, email: `${id}@x.ng`, image, role, status: "active", termsVersion: CURRENT_TERMS_VERSION,
});

describe("#1 account photos can't delete other files", () => {
  it("only treats the person's own avatar keys as deletable", () => {
    expect(ownAvatarKey("u1", "/api/media/avatars/u1/0b6c7a2e-1111-4a3b-9c1d-2e3f4a5b6c7d.webp")).toBe("avatars/u1/0b6c7a2e-1111-4a3b-9c1d-2e3f4a5b6c7d.webp");
    expect(ownAvatarKey("u1", "/api/media/recordings/p1/b1.ogg")).toBeNull();
    expect(ownAvatarKey("u1", "/api/media/avatars/p1/abc.webp")).toBeNull();
    expect(ownAvatarKey("u1", "/api/media/avatars/u1/../../recordings/p1/b1.ogg")).toBeNull();
    expect(ownAvatarKey("u1", "https://lh3.googleusercontent.com/a/photo")).toBeNull();
  });

  it("removing a photo whose image points at a recording deletes nothing", async () => {
    const env = createTestEnv();
    insertUser(env.DB, { id: "u1" });
    const deleted: string[] = [];
    const bucket = { put: async () => {}, delete: async (key: string) => void deleted.push(key) } as unknown as R2Bucket;
    await saveMyAccountPhoto(env.DB, bucket, viewer("u1", "listener", "/api/media/recordings/p1/b1.ogg"), null);
    expect(deleted).toEqual([]);
  });
});

function live(env: ReturnType<typeof createTestEnv>, id = "b1") {
  env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES (?, 'p1', 'Sunday', 'live', '2026-11-01T09:00:00.000Z')").run(id);
}

describe("#3 a broadcast ends after the grace even while listeners churn", () => {
  it("ends 'disconnected' at the time the preacher left", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    live(env);
    participants.mockResolvedValue([{ identity: "anon-1", tracks: [] }, { identity: "anon-2", tracks: [] }]);
    const t0 = new Date("2026-11-01T09:30:00.000Z");
    await syncBroadcast(env, "b1", t0); // preacher missing → marked gone at t0
    await syncBroadcast(env, "b1", new Date(t0.getTime() + 30_000)); // within grace: still live
    expect(env.DB.sqlite.prepare("SELECT status FROM broadcasts").get()).toEqual({ status: "live" });
    await syncBroadcast(env, "b1", new Date(t0.getTime() + 90_000)); // a listener joined after the grace
    expect(env.DB.sqlite.prepare("SELECT status, ended_reason, ended_at FROM broadcasts").get()).toEqual({
      status: "ended",
      ended_reason: "disconnected",
      ended_at: t0.toISOString(),
    });
  });
});

describe("#4 a recording that never started doesn't stay 'processing'", () => {
  it("is marked failed when the broadcast ends, and a stuck one can be deleted", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    live(env);
    env.DB.sqlite.prepare("INSERT INTO recordings (id, broadcast_id, preacher_id, title, r2_key) VALUES ('r1', 'b1', 'p1', 'Sunday', 'k')").run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await stopRecording(env, "b1", { listParticipants: vi.fn(), startTrackEgress: vi.fn(), stopEgress: vi.fn() });
    expect(env.DB.sqlite.prepare("SELECT status FROM recordings").get()).toEqual({ status: "failed" });

    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at, ended_at, ended_reason) VALUES ('b2', 'p1', 'Old', 'ended', '2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z', 'preacher')").run();
    env.DB.sqlite.prepare("INSERT INTO recordings (id, broadcast_id, preacher_id, title, r2_key, created_at) VALUES ('r2', 'b2', 'p1', 'Old', 'k2', '2026-01-01T01:00:00.000Z')").run();
    const bucket = { delete: vi.fn(async () => {}) } as unknown as R2Bucket;
    await deleteMyRecording(env.DB, bucket, viewer("p1", "preacher"), "r2");
    expect(env.DB.sqlite.prepare("SELECT status FROM recordings WHERE id = 'r2'").get()).toEqual({ status: "deleted" });
  });
});

describe("#6 a suspended preacher can't go live with an earlier token", () => {
  it("won't mark live, and suspension ends their ready broadcasts", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    insertUser(env.DB, { id: "a1", role: "admin" });
    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title) VALUES ('b1', 'p1', 'Ready')").run();
    await runAdminAction(env, { ...viewer("a1", "admin") }, { action: "suspend_user", targetId: "p1", reason: "Scam" });
    expect(env.DB.sqlite.prepare("SELECT status, ended_reason FROM broadcasts").get()).toEqual({ status: "ended", ended_reason: "admin" });
    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title) VALUES ('b2', 'p1', 'Another')").run();
    expect(await markLive(env, "b2")).toBe(false);
  });
});

describe("#7 public broadcast pages", () => {
  it("hide broadcasts that haven't started and ones an admin ended", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title) VALUES ('ready1', 'p1', 'Not yet')").run();
    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at, ended_at, ended_reason) VALUES ('adm', 'p1', 'Removed', 'ended', '2026-11-01T09:00:00Z', '2026-11-01T09:10:00Z', 'admin')").run();
    live(env, "ok");
    expect(await getBroadcastWithPreacher(env.DB, "ready1")).toBeNull();
    expect(await getBroadcastWithPreacher(env.DB, "adm")).toBeNull();
    expect(await getBroadcastWithPreacher(env.DB, "ok")).not.toBeNull();
  });
});
