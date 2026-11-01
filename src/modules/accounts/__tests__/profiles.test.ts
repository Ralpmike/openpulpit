import { describe, expect, it } from "vitest";

import { slugify, initials } from "@/helpers/text/slug";
import { preacherProfileSchema } from "@/modules/accounts/schemas/profile";
import { getPublicProfileBySlug } from "@/modules/accounts/server/repo";
import { saveMyPhoto, saveMyProfile } from "@/modules/accounts/server/profiles";
import type { Viewer } from "@/modules/accounts/server/session";
import { createTestD1, insertUser } from "@/test/d1";

const preacher = (id: string): Viewer => ({ id, name: id, email: `${id}@x.ng`, image: null, role: "preacher", status: "active", termsVersion: "" });
const profile = {
  displayName: "Pastor Adebayo Ogunleye",
  slug: "adebayo",
  ministry: "Living Word Chapel",
  state: "Oyo" as const,
  city: "Ibadan",
  denomination: "",
  bio: "",
};

describe("preacher profiles", () => {
  it("saves a profile, renames the account, and refuses a taken link", async () => {
    const db = createTestD1();
    insertUser(db, { id: "p1", role: "preacher" });
    insertUser(db, { id: "p2", role: "preacher" });
    const saved = await saveMyProfile(db, preacher("p1"), profile);
    expect(saved).toMatchObject({ slug: "adebayo", isVerified: false, photoUrl: null });
    expect(db.sqlite.prepare(`SELECT name FROM "user" WHERE id = 'p1'`).get()).toEqual({ name: "Pastor Adebayo Ogunleye" });
    await expect(saveMyProfile(db, preacher("p2"), profile)).rejects.toMatchObject({ status: 409, field: "slug" });
  });

  it("refuses listeners", async () => {
    const db = createTestD1();
    insertUser(db, { id: "l1" });
    await expect(saveMyProfile(db, { ...preacher("l1"), role: "listener" }, profile)).rejects.toMatchObject({ status: 403 });
  });

  it("hides suspended preachers from the public page", async () => {
    const db = createTestD1();
    insertUser(db, { id: "p1", role: "preacher" });
    await saveMyProfile(db, preacher("p1"), profile);
    expect(await getPublicProfileBySlug(db, "adebayo")).not.toBeNull();
    db.sqlite.prepare(`UPDATE "user" SET status = 'suspended' WHERE id = 'p1'`).run();
    expect(await getPublicProfileBySlug(db, "adebayo")).toBeNull();
  });

  it("stores photos privately under the preacher's key and checks type and size", async () => {
    const db = createTestD1();
    insertUser(db, { id: "p1", role: "preacher" });
    const stored = new Map<string, unknown>();
    const bucket = { put: async (key: string, value: unknown) => void stored.set(key, value), delete: async () => {} } as unknown as R2Bucket;
    const photo = new File([new Uint8Array(1000)], "me.webp", { type: "image/webp" });
    await expect(saveMyPhoto(db, bucket, preacher("p1"), photo)).rejects.toMatchObject({ status: 409 });
    await saveMyProfile(db, preacher("p1"), profile);
    const { photoUrl } = await saveMyPhoto(db, bucket, preacher("p1"), photo);
    expect(photoUrl).toMatch(/^\/api\/media\/avatars\/p1\/[0-9a-f-]+\.webp$/);
    const gif = new File([new Uint8Array(10)], "x.gif", { type: "image/gif" });
    await expect(saveMyPhoto(db, bucket, preacher("p1"), gif)).rejects.toMatchObject({ status: 400 });
  });
});

describe("profile schema and helpers", () => {
  it("validates links and requires a Nigerian state", () => {
    expect(preacherProfileSchema.safeParse({ ...profile, slug: "Bad Link!" }).success).toBe(false);
    expect(preacherProfileSchema.safeParse({ ...profile, state: "Texas" }).success).toBe(false);
    expect(preacherProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("makes links and initials from names", () => {
    expect(slugify("Pastor Adébáyọ̀ Ogunleye")).toBe("pastor-adebayo-ogunleye");
    expect(initials("Rev. Chiamaka Eze")).toBe("RE");
    expect(initials("Musa")).toBe("M");
  });
});
