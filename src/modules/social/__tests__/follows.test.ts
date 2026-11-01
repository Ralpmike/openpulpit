import { describe, expect, it } from "vitest";

import type { Viewer } from "@/modules/accounts";
import { follow, getFollowState, listFollowing, unfollow } from "@/modules/social/server/follows";
import { createTestD1, insertUser } from "@/test/d1";
import { seedPreacher } from "@/test/seed";

const listener: Viewer = { id: "l1", name: "Ngozi", email: "n@x.ng", image: null, role: "listener", status: "active", termsVersion: "" };

function setup() {
  const db = createTestD1();
  seedPreacher(db, "p1");
  seedPreacher(db, "p2");
  insertUser(db, { id: "l1" });
  return db;
}

describe("follows", () => {
  it("follows and unfollows, safely repeated, with counts", async () => {
    const db = setup();
    expect(await follow(db, listener, "pastor-p1")).toMatchObject({ isFollowing: true, notificationsEnabled: true, followerCount: 1 });
    expect(await follow(db, listener, "pastor-p1")).toMatchObject({ followerCount: 1 });
    expect(await unfollow(db, listener, "pastor-p1")).toMatchObject({ isFollowing: false, followerCount: 0 });
    expect(await unfollow(db, listener, "pastor-p1")).toMatchObject({ isFollowing: false });
  });

  it("refuses following yourself and preachers who blocked you", async () => {
    const db = setup();
    await expect(follow(db, { ...listener, id: "p1", role: "preacher" }, "pastor-p1")).rejects.toMatchObject({ status: 409 });
    db.sqlite.prepare("INSERT INTO blocks (preacher_id, listener_id) VALUES ('p2', 'l1')").run();
    await expect(follow(db, listener, "pastor-p2")).rejects.toMatchObject({ status: 403 });
  });

  it("lists followed preachers, live ones first; visitors see counts only", async () => {
    const db = setup();
    await follow(db, listener, "pastor-p1");
    await follow(db, listener, "pastor-p2");
    db.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('b', 'p2', 'Live now', 'live', '2026-11-01T10:00:00Z')").run();
    expect((await listFollowing(db, listener)).map((p) => [p.slug, p.isLive])).toEqual([
      ["pastor-p2", true],
      ["pastor-p1", false],
    ]);
    expect(await getFollowState(db, null, "pastor-p1")).toMatchObject({ isFollowing: false, followerCount: 1, isSelf: false });
  });

  it("404s for unknown preachers", async () => {
    await expect(follow(setup(), listener, "nobody-here")).rejects.toMatchObject({ status: 404 });
  });
});

describe("per-preacher notifications", () => {
  it("turns notifications off and on for one followed preacher only", async () => {
    const { setNotifications } = await import("@/modules/social/server/follows");
    const db = setup();
    await follow(db, listener, "pastor-p1");
    await follow(db, listener, "pastor-p2");
    expect(await setNotifications(db, listener, "pastor-p1", false)).toMatchObject({ isFollowing: true, notificationsEnabled: false });
    expect((await listFollowing(db, listener)).map((p) => [p.slug, p.notificationsEnabled])).toEqual([
      ["pastor-p1", false],
      ["pastor-p2", true],
    ]);
    await unfollow(db, listener, "pastor-p2");
    await expect(setNotifications(db, listener, "pastor-p2", true)).rejects.toMatchObject({ status: 409 });
  });
});
