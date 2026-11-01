import "server-only";

import { photoUrl } from "@/modules/accounts";
import type { PublicBroadcast } from "@/modules/broadcasting/models";

/** Who is live now (requirement 11), newest first, preachers in good standing only. */
export async function listLiveNow(db: D1Database, limit = 20): Promise<PublicBroadcast[]> {
  const { results } = await db
    .prepare(
      `SELECT b.id, b.title, b.description, b.bible_passage, b.status, b.started_at, b.ended_at, b.current_listeners,
              p.display_name, p.slug, p.photo_key, p.is_verified
         FROM broadcasts b
         JOIN preacher_profiles p ON p.user_id = b.preacher_id
         JOIN "user" u ON u.id = b.preacher_id
        WHERE b.status = 'live' AND u.status IN ('active', 'warned')
        ORDER BY b.started_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<{
      id: string; title: string; description: string; bible_passage: string; status: PublicBroadcast["status"];
      started_at: string | null; ended_at: string | null; current_listeners: number;
      display_name: string; slug: string; photo_key: string; is_verified: number;
    }>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    biblePassage: row.bible_passage,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    listenerCount: row.current_listeners,
    preacher: { name: row.display_name, slug: row.slug, photoUrl: photoUrl(row.photo_key), isVerified: Boolean(row.is_verified) },
  }));
}
