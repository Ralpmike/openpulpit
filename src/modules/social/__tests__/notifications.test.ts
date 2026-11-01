import { describe, expect, it, vi } from "vitest";

import { notifyFollowersOfLive, saveSubscription } from "@/modules/social/server/notifications";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";
import { seedPreacher } from "@/test/seed";

function setup() {
  const env = createTestEnv({ VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" } as Partial<CloudflareEnv>);
  const db = env.DB;
  seedPreacher(db, "p1", { name: "Pastor Ade" });
  for (const id of ["fan", "muted", "blocked", "gone", "stranger"]) insertUser(db, { id });
  for (const id of ["fan", "muted", "blocked", "gone"]) {
    db.sqlite.prepare("INSERT INTO follows (listener_id, preacher_id, notifications_enabled) VALUES (?, 'p1', ?)").run(id, id === "muted" ? 0 : 1);
  }
  db.sqlite.prepare("INSERT INTO blocks (preacher_id, listener_id) VALUES ('p1', 'blocked')").run();
  db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('b1', 'p1', 'Sunday Service', 'live', '2026-11-01T09:00:00Z')").run();
  return env;
}

describe("go-live notifications", () => {
  it("sends one push per broadcast to followers who want it, and cleans up gone subscriptions", async () => {
    const env = setup();
    for (const id of ["fan", "muted", "blocked", "gone", "stranger"]) {
      await saveSubscription(env.DB, id, { endpoint: `https://push.example/${id}`, keys: { p256dh: "k", auth: "a" } });
    }
    const send = vi.fn(async (subscription: { endpoint: string }, payload: unknown): Promise<"gone" | "sent"> => {
      expect(payload).toBeTruthy();
      return subscription.endpoint.endsWith("/gone") ? "gone" : "sent";
    });
    const broadcast = { id: "b1", preacher_id: "p1", title: "Sunday Service" };

    const first = await notifyFollowersOfLive(env, broadcast, { send: send as never });
    expect(first).toEqual({ sent: 1, removed: 1, skipped: false });
    expect(send.mock.calls.map(([s]) => s.endpoint).sort()).toEqual(["https://push.example/fan", "https://push.example/gone"]);
    expect(send.mock.calls[0]![1]).toMatchObject({ title: "Pastor Ade is live", body: "Sunday Service", url: "/live/b1" });
    expect(env.DB.sqlite.prepare("SELECT count(*) AS n FROM push_subscriptions WHERE endpoint LIKE '%/gone'").get()).toEqual({ n: 0 });

    // A reconnect or a retried webhook must not notify again.
    expect(await notifyFollowersOfLive(env, broadcast, { send: send as never })).toMatchObject({ skipped: true });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
