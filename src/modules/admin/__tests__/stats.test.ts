import { describe, expect, it, vi } from "vitest";

const participants = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));
vi.mock("@/lib/livekit", () => ({ liveKitConfig: () => ({}), roomService: () => ({ listParticipants: participants, deleteRoom: async () => {} }) }));

import { getPlatformStats } from "@/modules/admin/server/stats";
import { endBroadcast, syncBroadcast } from "@/modules/broadcasting/server/lifecycle";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";
import { seedPreacher } from "@/test/seed";

describe("platform stats", () => {
  it("adds up hours streamed, listener-hours and live bandwidth from heartbeats", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    insertUser(env.DB, { id: "l1" });
    env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title) VALUES ('b1', 'p1', 'Sunday Service')").run();
    const preacher = { identity: "p1", tracks: [{ type: 0, muted: false }] };
    const listeners = Array.from({ length: 10 }, (_, i) => ({ identity: `anon-${i}`, tracks: [] }));
    participants.mockResolvedValue([preacher, ...listeners]);

    const t0 = new Date("2026-11-01T09:00:00Z");
    await syncBroadcast(env, "b1", t0); // goes live, 10 listeners, first sync sets the clock
    await syncBroadcast(env, "b1", new Date(t0.getTime() + 60_000)); // +60 s × 10 listeners
    await syncBroadcast(env, "b1", new Date(t0.getTime() + 10 * 60_000)); // gap capped at 120 s × 10
    env.DB.sqlite.prepare("UPDATE broadcasts SET started_at = ? WHERE id = 'b1'").run(t0.toISOString());
    await endBroadcast(env, "b1", "preacher", { now: new Date(t0.getTime() + 3600_000) });

    const row = env.DB.sqlite.prepare("SELECT listener_seconds, peak_listeners FROM broadcasts WHERE id = 'b1'").get();
    expect(row).toEqual({ listener_seconds: 1800, peak_listeners: 10 });
    const stats = await getPlatformStats(env.DB);
    expect(stats).toMatchObject({ preachers: 1, listeners: 1, broadcasts: 1, liveNow: 0, hoursStreamed: 1, listenHours: 0.5 });
    // 1,800 listener-seconds at 32 kbps = 7.2 MB
    expect(stats.days[0]).toMatchObject({ day: "2026-11-01", broadcastHours: 1, listenHours: 0.5 });
    expect(env.DB.sqlite.prepare("SELECT bandwidth_bytes FROM daily_stats").get()).toEqual({ bandwidth_bytes: 7_200_000 });
  });
});
