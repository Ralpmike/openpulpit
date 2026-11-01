import "server-only";

import { conflict, forbidden, notFound } from "@/lib/api";
import { getPublicProfileBySlug, photoUrl, type Viewer } from "@/modules/accounts";
import type { FollowedPreacher, FollowState } from "@/modules/social/models";

async function preacherIdForSlug(db: D1Database, slug: string): Promise<string> {
  const profile = await getPublicProfileBySlug(db, slug.toLowerCase());
  if (!profile) throw notFound("We couldn't find that preacher.");
  return profile.user_id;
}

export async function getFollowState(db: D1Database, viewer: Viewer | null, slug: string): Promise<FollowState> {
  const preacherId = await preacherIdForSlug(db, slug);
  const row = await db
    .prepare(
      `SELECT (SELECT count(*) FROM follows WHERE preacher_id = ?1) AS followers,
              (SELECT notifications_enabled FROM follows WHERE preacher_id = ?1 AND listener_id = ?2) AS notifications`,
    )
    .bind(preacherId, viewer?.id ?? "")
    .first<{ followers: number; notifications: number | null }>();
  return {
    isFollowing: row?.notifications !== null && row?.notifications !== undefined,
    notificationsEnabled: row?.notifications === 1,
    followerCount: row?.followers ?? 0,
    isSelf: viewer?.id === preacherId,
  };
}

/** Follow a preacher (requirement 16). Safe to repeat. Refused if the preacher blocked this listener. */
export async function follow(db: D1Database, viewer: Viewer, slug: string): Promise<FollowState> {
  const preacherId = await preacherIdForSlug(db, slug);
  if (preacherId === viewer.id) throw conflict("You can't follow yourself.");
  const result = await db
    .prepare(
      `INSERT INTO follows (listener_id, preacher_id)
       SELECT ?1, ?2 WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE preacher_id = ?2 AND listener_id = ?1)
       ON CONFLICT (listener_id, preacher_id) DO NOTHING`,
    )
    .bind(viewer.id, preacherId)
    .run();
  if (!result.meta.changes) {
    const blocked = await db.prepare("SELECT 1 AS b FROM blocks WHERE preacher_id = ? AND listener_id = ?").bind(preacherId, viewer.id).first();
    if (blocked) throw forbidden("You can't follow this preacher.");
  }
  return getFollowState(db, viewer, slug);
}

export async function unfollow(db: D1Database, viewer: Viewer, slug: string): Promise<FollowState> {
  const preacherId = await preacherIdForSlug(db, slug);
  await db.prepare("DELETE FROM follows WHERE listener_id = ? AND preacher_id = ?").bind(viewer.id, preacherId).run();
  return getFollowState(db, viewer, slug);
}

/** The preachers this person follows, live ones first (requirements 5 and 16). */
export async function listFollowing(db: D1Database, viewer: Viewer): Promise<FollowedPreacher[]> {
  const { results } = await db
    .prepare(
      `SELECT p.display_name, p.slug, p.photo_key, p.is_verified, p.ministry, p.city, p.state, f.notifications_enabled,
              EXISTS (SELECT 1 FROM broadcasts b WHERE b.preacher_id = p.user_id AND b.status = 'live') AS is_live
         FROM follows f
         JOIN preacher_profiles p ON p.user_id = f.preacher_id
         JOIN "user" u ON u.id = f.preacher_id
        WHERE f.listener_id = ? AND u.status IN ('active', 'warned')
        ORDER BY is_live DESC, p.display_name ASC`,
    )
    .bind(viewer.id)
    .all<{ display_name: string; slug: string; photo_key: string; is_verified: number; ministry: string; city: string; state: string; notifications_enabled: number; is_live: number }>();
  return results.map((row) => ({
    name: row.display_name,
    slug: row.slug,
    photoUrl: photoUrl(row.photo_key),
    isVerified: Boolean(row.is_verified),
    ministry: row.ministry,
    location: [row.city, row.state].filter(Boolean).join(", "),
    notificationsEnabled: Boolean(row.notifications_enabled),
    isLive: Boolean(row.is_live),
  }));
}

/** Turn go-live notifications for one followed preacher on or off (requirement 18). */
export async function setNotifications(db: D1Database, viewer: Viewer, slug: string, isEnabled: boolean): Promise<FollowState> {
  const preacherId = await preacherIdForSlug(db, slug);
  const result = await db
    .prepare("UPDATE follows SET notifications_enabled = ? WHERE listener_id = ? AND preacher_id = ?")
    .bind(isEnabled ? 1 : 0, viewer.id, preacherId)
    .run();
  if (!result.meta.changes) throw conflict("Follow this preacher first.");
  return getFollowState(db, viewer, slug);
}
