import "server-only";

import { photoUrl } from "@/modules/accounts";
import type { PublicBroadcast } from "@/modules/broadcasting/models";

/** A broadcast with its preacher's public details, only for preachers in good standing. */
export async function getBroadcastWithPreacher(db: D1Database, id: string): Promise<PublicBroadcast | null> {
  const row = await db
    .prepare(
      `SELECT b.id, b.title, b.description, b.bible_passage, b.status, b.started_at, b.ended_at, b.current_listeners,
              p.display_name, p.slug, p.photo_key, p.is_verified
         FROM broadcasts b
         JOIN preacher_profiles p ON p.user_id = b.preacher_id
         JOIN "user" u ON u.id = b.preacher_id
        WHERE b.id = ? AND u.status IN ('active', 'warned')`,
    )
    .bind(id)
    .first<{
      id: string; title: string; description: string; bible_passage: string; status: PublicBroadcast["status"];
      started_at: string | null; ended_at: string | null; current_listeners: number;
      display_name: string; slug: string; photo_key: string; is_verified: number;
    }>();
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    biblePassage: row.bible_passage,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    listenerCount: row.current_listeners,
    preacher: { name: row.display_name, slug: row.slug, photoUrl: photoUrl(row.photo_key), isVerified: Boolean(row.is_verified) },
  };
}
