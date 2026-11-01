import "server-only";

import type { PreacherSummary } from "@/modules/broadcasting/models";
import { photoUrl } from "@/modules/accounts/server/profiles";

export interface SuggestedPreacher extends PreacherSummary {
  ministry: string;
  location: string;
}

/**
 * Suggested preachers (requirement 11): verified first, then those with the
 * most followers, then the most recent recordings. Excludes ones the viewer follows.
 */
export async function listSuggestedPreachers(db: D1Database, { viewerId, limit = 8 }: { viewerId?: string | null; limit?: number } = {}) {
  const { results } = await db
    .prepare(
      `SELECT p.display_name, p.slug, p.photo_key, p.is_verified, p.ministry, p.city, p.state,
              (SELECT count(*) FROM follows f WHERE f.preacher_id = p.user_id) AS followers,
              (SELECT max(r.created_at) FROM recordings r WHERE r.preacher_id = p.user_id AND r.status = 'ready' AND r.visibility = 'public') AS last_recording
         FROM preacher_profiles p JOIN "user" u ON u.id = p.user_id
        WHERE u.role IN ('preacher', 'admin') AND u.status IN ('active', 'warned')
          AND (?1 IS NULL OR (p.user_id <> ?1 AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.listener_id = ?1 AND f.preacher_id = p.user_id)))
        ORDER BY p.is_verified DESC, followers DESC, last_recording DESC NULLS LAST
        LIMIT ?2`,
    )
    .bind(viewerId ?? null, limit)
    .all<{ display_name: string; slug: string; photo_key: string; is_verified: number; ministry: string; city: string; state: string }>();
  return results.map(
    (row): SuggestedPreacher => ({
      name: row.display_name,
      slug: row.slug,
      photoUrl: photoUrl(row.photo_key),
      isVerified: Boolean(row.is_verified),
      ministry: row.ministry,
      location: [row.city, row.state].filter(Boolean).join(", "),
    }),
  );
}
