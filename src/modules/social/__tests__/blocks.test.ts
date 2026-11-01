import { describe, expect, it } from "vitest";

import { CURRENT_TERMS_VERSION, type Viewer } from "@/modules/accounts";
import { blockListener, listMyBlocks, listMyFollowers, unblockListener } from "@/modules/social/server/blocks";
import { follow } from "@/modules/social/server/follows";
import { notifyFollowersOfLive, saveSubscription } from "@/modules/social/server/notifications";
import { insertUser } from "@/test/d1";
import { createTestEnv } from "@/test/env";
import { seedPreacher } from "@/test/seed";

const preacher: Viewer = { id: "p1", name: "Ade", email: "p@x.ng", image: null, role: "preacher", status: "active", termsVersion: CURRENT_TERMS_VERSION };
const listener: Viewer = { ...preacher, id: "l1", role: "listener" };

describe("blocking", () => {
  it("removes the follow, prevents re-following and leaves them out of notifications; unblock allows following again", async () => {
    const env = createTestEnv({ VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" } as Partial<CloudflareEnv>);
    const db = env.DB;
    seedPreacher(db, "p1");
    insertUser(db, { id: "l1", name: "Tunde" });
    await follow(db, listener, "pastor-p1");
    expect((await listMyFollowers(db, preacher)).map((f) => f.name)).toEqual(["Tunde"]);

    await blockListener(db, preacher, "l1");
    expect(await listMyFollowers(db, preacher)).toEqual([]);
    expect((await listMyBlocks(db, preacher)).map((f) => f.id)).toEqual(["l1"]);
    await expect(follow(db, listener, "pastor-p1")).rejects.toMatchObject({ status: 403 });

    await saveSubscription(db, "l1", { endpoint: "https://push.example/l1", keys: { p256dh: "k", auth: "a" } });
    db.sqlite.prepare("INSERT INTO follows (listener_id, preacher_id) VALUES ('l1', 'p1')").run(); // even if a follow slipped in
    db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('b1', 'p1', 'Live', 'live', '2026-11-01T09:00:00Z')").run();
    const sent: string[] = [];
    await notifyFollowersOfLive(env, { id: "b1", preacher_id: "p1", title: "Live" }, { send: (async (s: { endpoint: string }) => (sent.push(s.endpoint), "sent")) as never });
    expect(sent).toEqual([]);

    db.sqlite.prepare("DELETE FROM follows").run();
    await unblockListener(db, preacher, "l1");
    await expect(follow(db, listener, "pastor-p1")).resolves.toMatchObject({ isFollowing: true });
  });

  it("refuses blocking yourself or someone unknown", async () => {
    const env = createTestEnv();
    seedPreacher(env.DB, "p1");
    await expect(blockListener(env.DB, preacher, "p1")).rejects.toMatchObject({ status: 409 });
    await expect(blockListener(env.DB, preacher, "ghost")).rejects.toMatchObject({ status: 404 });
  });
});
