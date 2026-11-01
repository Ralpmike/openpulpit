import { describe, expect, it, vi } from "vitest";

const participants = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));
vi.mock("@/lib/livekit", () => ({ liveKitConfig: () => ({}), roomService: () => ({ listParticipants: participants, deleteRoom: async () => {} }) }));

import { checkCosts, costThresholds, sendCostAlerts } from "@/modules/admin/server/costs";
import { sweepLiveBroadcasts } from "@/modules/broadcasting/server/sweep";
import { createTestEnv } from "@/test/env";
import { seedPreacher, seedRecording } from "@/test/seed";

const now = new Date("2026-11-01T12:00:00Z");

describe("cost monitoring", () => {
  it("compares today's bandwidth, LiveKit minutes and failed recordings with the limits", async () => {
    const env = createTestEnv({ COST_ALERT_DAILY_BANDWIDTH_GB: "1", COST_ALERT_DAILY_LIVEKIT_MINUTES: "1000" } as Partial<CloudflareEnv>);
    env.DB.sqlite.prepare("INSERT INTO daily_stats (day, broadcast_seconds, listen_seconds, bandwidth_bytes) VALUES ('2026-11-01', 3600, 57600, 1500000000)").run();
    seedPreacher(env.DB, "p1");
    seedRecording(env.DB, "r1", "p1", { status: "failed", createdAt: "2026-11-01T10:00:00.000Z" });
    const checks = await checkCosts(env.DB, costThresholds(env), now);
    expect(checks.map((c) => [c.metric, Math.round(c.value * 10) / 10, c.isOver])).toEqual([
      ["bandwidth", 1.5, true],
      ["livekit_minutes", 1020, true],
      ["failed_recordings", 1, true],
    ]);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendCostAlerts(env, checks, now)).toEqual(["bandwidth", "livekit_minutes", "failed_recordings"]);
    expect(await sendCostAlerts(env, checks, now)).toEqual([]); // once a day
    expect(errors).toHaveBeenCalledTimes(3);
  });

  it("stays quiet under the limits", async () => {
    const env = createTestEnv();
    expect((await checkCosts(env.DB, costThresholds(env), now)).some((c) => c.isOver)).toBe(false);
  });
});

describe("live broadcast safety net", () => {
  it("ends a broadcast whose preacher vanished without a heartbeat, after the grace", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    env.DB.sqlite
      .prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at, last_synced_at) VALUES ('b1', 'p1', 'Sunday', 'live', '2026-11-01T11:00:00Z', '2026-11-01T11:40:00Z')")
      .run();
    participants.mockResolvedValue([]); // the preacher's app died; nobody publishing
    expect(await sweepLiveBroadcasts(env, now)).toEqual({ checked: 1, ended: 0 }); // marked gone now
    expect(await sweepLiveBroadcasts(env, new Date(now.getTime() + 4 * 60_000))).toEqual({ checked: 1, ended: 1 });
    expect(env.DB.sqlite.prepare("SELECT status, ended_reason FROM broadcasts").get()).toEqual({ status: "ended", ended_reason: "disconnected" });
  });

  it("leaves broadcasts with recent heartbeats alone", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    env.DB.sqlite
      .prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at, last_synced_at) VALUES ('b1', 'p1', 'Sunday', 'live', '2026-11-01T11:00:00Z', '2026-11-01T11:59:00Z')")
      .run();
    expect(await sweepLiveBroadcasts(env, now)).toEqual({ checked: 0, ended: 0 });
  });
});
