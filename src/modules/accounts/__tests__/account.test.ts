import { describe, expect, it } from "vitest";

import { saveMyAccountPhoto, updateMyName } from "@/modules/accounts/server/account";
import type { Viewer } from "@/modules/accounts/server/session";
import { createTestD1, insertUser } from "@/test/d1";

const listener: Viewer = { id: "l1", name: "Ngozi", email: "n@x.ng", image: null, role: "listener", status: "active", termsVersion: "" };

describe("listener profile", () => {
  it("renames the account", async () => {
    const db = createTestD1();
    insertUser(db, { id: "l1" });
    await updateMyName(db, listener, "Ngozi Okafor");
    expect(db.sqlite.prepare(`SELECT name FROM "user" WHERE id = 'l1'`).get()).toEqual({ name: "Ngozi Okafor" });
  });

  it("adds, replaces and removes the optional photo, deleting the old file", async () => {
    const db = createTestD1();
    insertUser(db, { id: "l1" });
    const deleted: string[] = [];
    const bucket = { put: async () => {}, delete: async (key: string) => void deleted.push(key) } as unknown as R2Bucket;
    const photo = new File([new Uint8Array(100)], "me.webp", { type: "image/webp" });
    const { photoUrl } = await saveMyAccountPhoto(db, bucket, listener, photo);
    expect(photoUrl).toMatch(/^\/api\/media\/avatars\/l1\//);
    await saveMyAccountPhoto(db, bucket, { ...listener, image: photoUrl }, null);
    expect(deleted).toEqual([photoUrl!.replace("/api/media/", "")]);
    expect(db.sqlite.prepare(`SELECT image FROM "user" WHERE id = 'l1'`).get()).toEqual({ image: null });
  });
});
