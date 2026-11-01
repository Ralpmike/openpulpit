import "server-only";

import { badRequest } from "@/lib/api";
import { newId, nowIso } from "@/lib/ids";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/modules/accounts/schemas/profile";
import { photoUrl } from "@/modules/accounts/server/profiles";
import type { Viewer } from "@/modules/accounts/server/session";

/**
 * The R2 key of this person's own uploaded avatar, or null. Never trust
 * user.image as a key: only avatars/<their id>/<uuid>.<ext> can be deleted.
 */
export function ownAvatarKey(userId: string, image: string | null | undefined): string | null {
  if (!image?.startsWith("/api/media/")) return null;
  const key = image.slice("/api/media/".length);
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^avatars/${escaped}/[A-Za-z0-9-]+\\.(webp|jpg|png)$`).test(key) ? key : null;
}

/** Listener profile (requirement 5): a name and an optional photo. */
export async function updateMyName(db: D1Database, viewer: Viewer, name: string): Promise<void> {
  await db.prepare(`UPDATE "user" SET name = ?, updatedAt = ? WHERE id = ?`).bind(name, nowIso(), viewer.id).run();
}

export async function saveMyAccountPhoto(
  db: D1Database,
  bucket: R2Bucket,
  viewer: Viewer,
  file: File | null,
): Promise<{ photoUrl: string | null }> {
  const previous = ownAvatarKey(viewer.id, viewer.image);
  let url: string | null = null;
  if (file) {
    if (!PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number])) throw badRequest("Upload a JPEG, PNG or WebP photo.");
    if (file.size > PHOTO_MAX_BYTES) throw badRequest("That photo is too large. Use one under 1 MB.");
    const key = `avatars/${viewer.id}/${newId()}.webp`;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    });
    url = photoUrl(key);
  }
  await db.prepare(`UPDATE "user" SET image = ?, updatedAt = ? WHERE id = ?`).bind(url, nowIso(), viewer.id).run();
  if (previous) await bucket.delete(previous).catch(() => undefined);
  return { photoUrl: url };
}
