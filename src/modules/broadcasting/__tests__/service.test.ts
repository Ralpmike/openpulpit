import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));

import type { Viewer } from "@/modules/accounts";
import { saveMyProfile } from "@/modules/accounts/server/profiles";
import { createBroadcast, getHoursSummary, issueListenToken, issuePublishToken } from "@/modules/broadcasting/server/service";
import { insertUser } from "@/test/d1";
import { createTestEnv, decodeJwt } from "@/test/env";

const preacher: Viewer = { id: "p1", name: "Pastor Ade", email: "p1@x.ng", image: null, role: "preacher", status: "active", termsVersion: "" };
const details = { title: "Sunday Service", description: "", biblePassage: "John 3:16" };

async function setup() {
  const env = createTestEnv();
  insertUser(env.DB, { id: "p1", role: "preacher" });
  insertUser(env.DB, { id: "p2", role: "preacher" });
  await saveMyProfile(env.DB, preacher, {
    displayName: "Pastor Ade", slug: "ade", ministry: "Living Word", state: "Oyo", city: "Ibadan", denomination: "", bio: "",
  });
  return env;
}

describe("broadcasting service", () => {
  let env: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    env = await setup();
  });

  it("needs a preacher profile before creating a broadcast", async () => {
    await expect(createBroadcast(env.DB, { ...preacher, id: "p2" }, details)).rejects.toMatchObject({ status: 409 });
    await expect(createBroadcast(env.DB, preacher, details)).resolves.toMatchObject({ status: "ready", biblePassage: "John 3:16" });
  });

  it("mints a microphone-only publish token for the owner's room", async () => {
    const broadcast = await createBroadcast(env.DB, preacher, details);
    const grant = await issuePublishToken(env, preacher, broadcast.id);
    const claims = decodeJwt(grant.token) as { sub: string; video: Record<string, unknown>; roomConfig?: Record<string, unknown> };
    expect(claims.sub).toBe("p1");
    expect(claims.video).toMatchObject({ room: broadcast.id, roomJoin: true, canPublish: true, canSubscribe: false, canPublishData: false, canPublishSources: ["microphone"] });
    expect(grant.url).toBe("wss://livekit.test");
  });

  it("refuses other preachers, listeners, suspended accounts, ended broadcasts and empty hours", async () => {
    const broadcast = await createBroadcast(env.DB, preacher, details);
    await expect(issuePublishToken(env, { ...preacher, id: "p2" }, broadcast.id)).rejects.toMatchObject({ status: 404 });
    await expect(issuePublishToken(env, { ...preacher, role: "listener" }, broadcast.id)).rejects.toMatchObject({ status: 403 });
    await expect(issuePublishToken(env, { ...preacher, status: "suspended" }, broadcast.id)).rejects.toMatchObject({ status: 403 });
    await expect(issuePublishToken({ ...env, FREE_MONTHLY_BROADCAST_MINUTES: "0" }, preacher, broadcast.id)).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("broadcast hours"),
    });
    env.DB.sqlite
      .prepare("UPDATE broadcasts SET status = 'ended', started_at = ?, ended_at = ?, ended_reason = 'preacher' WHERE id = ?")
      .run("2026-11-01T09:00:00Z", "2026-11-01T10:00:00Z", broadcast.id);
    await expect(issuePublishToken(env, preacher, broadcast.id)).rejects.toMatchObject({ status: 409 });
  });

  it("refuses a second live broadcast", async () => {
    const first = await createBroadcast(env.DB, preacher, details);
    const second = await createBroadcast(env.DB, preacher, details);
    env.DB.sqlite.prepare("UPDATE broadcasts SET status = 'live', started_at = ? WHERE id = ?").run(new Date().toISOString(), first.id);
    await expect(issuePublishToken(env, preacher, second.id)).rejects.toMatchObject({ status: 409 });
    await expect(issuePublishToken(env, preacher, first.id)).resolves.toHaveProperty("token");
  });

  it("gives anyone a listen-only token for a live broadcast, and rate-limits it", async () => {
    const broadcast = await createBroadcast(env.DB, preacher, details);
    await expect(issueListenToken(env, { broadcastId: broadcast.id, viewer: null, networkKey: "1.1.1.1" })).rejects.toMatchObject({ status: 409 });
    env.DB.sqlite.prepare("UPDATE broadcasts SET status = 'live', started_at = ? WHERE id = ?").run(new Date().toISOString(), broadcast.id);
    const grant = await issueListenToken(env, { broadcastId: broadcast.id, viewer: null, networkKey: "1.1.1.1" });
    const claims = decodeJwt(grant.token) as { sub: string; video: Record<string, unknown> };
    expect(claims.sub).toMatch(/^anon-/);
    expect(claims.video).toMatchObject({ canPublish: false, canSubscribe: true, canPublishData: false });
    for (let i = 0; i < 30; i++) await issueListenToken(env, { broadcastId: broadcast.id, viewer: null, networkKey: "2.2.2.2" });
    await expect(issueListenToken(env, { broadcastId: broadcast.id, viewer: null, networkKey: "2.2.2.2" })).rejects.toMatchObject({ status: 429 });
  });

  it("reports hours used this Lagos month", async () => {
    const broadcast = await createBroadcast(env.DB, preacher, details);
    env.DB.sqlite
      .prepare("UPDATE broadcasts SET status = 'ended', started_at = ?, ended_at = ?, ended_reason = 'preacher' WHERE id = ?")
      .run("2026-11-02T09:00:00.000Z", "2026-11-02T10:30:00.000Z", broadcast.id);
    const hours = await getHoursSummary(env.DB, "p1", 600, new Date("2026-11-10T12:00:00Z"));
    expect(hours).toEqual({ capSeconds: 36000, usedSeconds: 5400, remainingSeconds: 30600, renewsAt: "2026-11-30T23:00:00.000Z" });
  });
});
