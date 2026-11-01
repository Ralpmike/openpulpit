import "server-only";

import { photoUrl } from "@/modules/accounts/server/profiles";
import type { SuggestedPreacher } from "@/modules/accounts/server/suggestions";

/**
 * Turns what a person typed into a safe FTS5 query: every word quoted (so
 * operators and punctuation can't break the query) and prefix-matched, all
 * words required. "pastor ibad" → "pastor"* "ibad"*
 */
export function toFtsQuery(input: string): string | null {
  const words = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)
    .slice(0, 6);
  if (!words.length) return null;
  return words.map((word) => `"${word}"*`).join(" ");
}

/** Search preachers by name, ministry, location or denomination (requirement 15). */
export async function searchPreachers(db: D1Database, query: string, limit = 20): Promise<SuggestedPreacher[]> {
  const fts = toFtsQuery(query);
  if (!fts) return [];
  const { results } = await db
    .prepare(
      `SELECT p.display_name, p.slug, p.photo_key, p.is_verified, p.ministry, p.city, p.state
         FROM preacher_search s
         JOIN preacher_profiles p ON p.user_id = s.user_id
         JOIN "user" u ON u.id = p.user_id
        WHERE preacher_search MATCH ?
          AND u.role IN ('preacher', 'admin') AND u.status IN ('active', 'warned')
        ORDER BY p.is_verified DESC, bm25(preacher_search, 0, 10.0, 5.0, 2.0, 2.0)
        LIMIT ?`,
    )
    .bind(fts, limit)
    .all<{ display_name: string; slug: string; photo_key: string; is_verified: number; ministry: string; city: string; state: string }>();
  return results.map((row) => ({
    name: row.display_name,
    slug: row.slug,
    photoUrl: photoUrl(row.photo_key),
    isVerified: Boolean(row.is_verified),
    ministry: row.ministry,
    location: [row.city, row.state].filter(Boolean).join(", "),
  }));
}
