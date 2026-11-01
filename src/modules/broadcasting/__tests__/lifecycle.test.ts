import { beforeEach, describe, expect, it, vi } from "vitest";

const participants = vi.fn();
const deleteRoom = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));
vi.mock("@/lib/livekit", () => ({
  liveKitConfig: () => ({}),
  roomService: () => ({ listParticipants: participants, deleteRoom }),
}));

import { endBroadcast, markLive, onBroadcastEnded, onBroadcastLive, syncBroadcast } from "@/modules/broadcasting/server/lifecycle";
import { handleLiveKitEvent } from "@/modules/broadcasting/server/webhooks";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";

const AUDIO = 0;
const preacherInRoom = { identity: "p1", tracks: [{ type: AUDIO, muted: false }] };
const listener = (n: number) => ({ identity: `anon-${n}`, tracks: [] });

function setup(overrides: Partial<CloudflareEnv> = {}) {
  const env = createTestEnv(overrides);
  insertUser(env.DB, { id: "p1", role: "preacher" });
  env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title) VALUES ('b1', 'p1', 'Sunday Service')").run();
  return env;
}
const row = (env: ReturnType<typeof setup>) =>
  env.DB.sqlite.prepare("SELECT status, ended_reason, peak_listeners, current_listeners, publisher_left_at, hours_warning_at FROM broadcasts WHERE id = 'b1'").get() as Record<string, unknown>;

describe("broadcast lifecycle", () => {
  beforeEach(() => {
    participants.mockReset();
    deleteRoom.mockReset().mockResolvedValue(undefined);
  });

  it("goes live once, however many times it's told", async () => {
    const env = setup();
    const live = vi.fn();
    onBroadcastLive(live);
    expect(await markLive(env, "b1")).toBe(true);
    expect(await markLive(env, "b1")).toBe(false);
    expect(live).toHaveBeenCalledOnce();
  });

  it("ends once, deletes the room and tells listeners (recording, stats)", async () => {
    const env = setup();
    const ended = vi.fn();
    onBroadcastEnded(ended);
    await markLive(env, "b1");
    expect(await endBroadcast(env, "b1", "preacher")).toBe(true);
    expect(await endBroadcast(env, "b1", "admin")).toBe(false);
    expect(row(env)).toMatchObject({ status: "ended", ended_reason: "preacher" });
    expect(deleteRoom).toHaveBeenCalledOnce();
    expect(ended).toHaveBeenCalledOnce();
  });

  it("syncs from the room: live when the preacher publishes, listeners counted without the preacher", async () => {
    const env = setup();
    participants.mockResolvedValue([preacherInRoom, listener(1), listener(2)]);
    const result = await syncBroadcast(env, "b1");
    expect(result?.broadcast.status).toBe("live");
    expect(row(env)).toMatchObject({ current_listeners: 2, peak_listeners: 2 });
    participants.mockResolvedValue([preacherInRoom, listener(1)]);
    await syncBroadcast(env, "b1");
    expect(row(env)).toMatchObject({ current_listeners: 1, peak_listeners: 2 });
  });

  it("warns at 10 minutes left and ends at zero (hours cap)", async () => {
    const env = setup({ FREE_MONTHLY_BROADCAST_MINUTES: "15" });
    participants.mockResolvedValue([preacherInRoom]);
    const start = new Date();
    await syncBroadcast(env, "b1", start);
    const warned = await syncBroadcast(env, "b1", new Date(start.getTime() + 6 * 60_000));
    expect(warned?.isHoursWarning).toBe(true);
    expect(row(env).hours_warning_at).not.toBeNull();
    const ended = await syncBroadcast(env, "b1", new Date(start.getTime() + 16 * 60_000));
    expect(ended?.broadcast.status).toBe("ended");
    expect(row(env)).toMatchObject({ ended_reason: "hours_cap" });
  });
});

describe("LiveKit webhooks", () => {
  it("marks the preacher gone, then ends with 'disconnected' when the room closes", async () => {
    const env = setup();
    participants.mockResolvedValue([listener(1)]);
    await markLive(env, "b1");
    const room = { name: "b1" };
    await handleLiveKitEvent(env, { event: "participant_left", room, participant: { identity: "p1" } } as never);
    expect(row(env).publisher_left_at).not.toBeNull();
    await handleLiveKitEvent(env, { event: "room_finished", room } as never);
    await handleLiveKitEvent(env, { event: "room_finished", room } as never);
    expect(row(env)).toMatchObject({ status: "ended", ended_reason: "disconnected" });
  });

  it("clears the 'gone' mark when the preacher comes back within the grace", async () => {
    const env = setup();
    await markLive(env, "b1");
    participants.mockResolvedValue([listener(1)]);
    await handleLiveKitEvent(env, { event: "participant_left", room: { name: "b1" }, participant: { identity: "p1" } } as never);
    participants.mockResolvedValue([preacherInRoom, listener(1)]);
    await handleLiveKitEvent(env, { event: "track_published", room: { name: "b1" }, participant: { identity: "p1" } } as never);
    expect(row(env)).toMatchObject({ status: "live", publisher_left_at: null });
  });

  it("ignores rooms that aren't broadcasts", async () => {
    const env = setup();
    await expect(handleLiveKitEvent(env, { event: "room_finished", room: { name: "nope" } } as never)).resolves.toBeUndefined();
  });
});
