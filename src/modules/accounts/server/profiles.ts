import "server-only";

import { ApiError, badRequest, conflict, forbidden } from "@/lib/api";
import { newId } from "@/lib/ids";
import type { PreacherProfile } from "@/modules/accounts/models";
import type { PreacherProfileInput } from "@/modules/accounts/schemas/profile";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/modules/accounts/schemas/profile";
import {
  getProfileByUserId,
  isSlugTaken,
  setPhotoKeyStatement,
  upsertProfile,
  type PreacherProfileRow,
} from "@/modules/accounts/server/repo";
import type { Viewer } from "@/modules/accounts/server/session";

/** Photos are served through our media route, never a public bucket URL. */
export const photoUrl = (key: string) => (key ? `/api/media/${key}` : null);

export function toPreacherProfile(row: PreacherProfileRow): PreacherProfile {
  return {
    userId: row.user_id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    ministry: row.ministry,
    state: row.state,
    city: row.city,
    denomination: row.denomination,
    photoUrl: photoUrl(row.photo_key),
    isVerified: Boolean(row.is_verified),
  };
}

function assertPreacher(viewer: Viewer) {
  if (viewer.role !== "preacher" && viewer.role !== "admin") throw forbidden("Only preachers have a public profile.");
}

export class SlugTakenError extends ApiError {
  readonly field = "slug";
  constructor() {
    super(409, "That profile link is taken. Try another.");
  }
}

export async function getMyProfile(db: D1Database, viewer: Viewer): Promise<PreacherProfile | null> {
  assertPreacher(viewer);
  const row = await getProfileByUserId(db, viewer.id);
  return row ? toPreacherProfile(row) : null;
}

export async function saveMyProfile(db: D1Database, viewer: Viewer, input: PreacherProfileInput): Promise<PreacherProfile> {
  assertPreacher(viewer);
  if (await isSlugTaken(db, input.slug, viewer.id)) throw new SlugTakenError();
  try {
    await upsertProfile(db, viewer.id, input);
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new SlugTakenError();
    throw error;
  }
  const row = await getProfileByUserId(db, viewer.id);
  return toPreacherProfile(row!);
}

export async function saveMyPhoto(
  db: D1Database,
  bucket: R2Bucket,
  viewer: Viewer,
  file: File,
): Promise<{ photoUrl: string }> {
  assertPreacher(viewer);
  if (!PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number])) throw badRequest("Upload a JPEG, PNG or WebP photo.");
  if (file.size > PHOTO_MAX_BYTES) throw badRequest("That photo is too large. Use one under 1 MB.");
  const profile = await getProfileByUserId(db, viewer.id);
  if (!profile) throw conflict("Save your profile first, then add a photo.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const key = `avatars/${viewer.id}/${newId()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  await setPhotoKeyStatement(db, viewer.id, key).run();
  if (profile.photo_key) await bucket.delete(profile.photo_key).catch(() => undefined);
  return { photoUrl: photoUrl(key)! };
}
