import "server-only";

import { photoUrl } from "@/modules/accounts";
import type { PublicRecording } from "@/modules/library/models";

/** Only ready, public recordings of preachers in good standing are ever listed (broadcasting-rules). */
export const PUBLIC_RECORDING_FILTER =
  "r.status = 'ready' AND r.visibility = 'public' AND u.status IN ('active', 'warned')";

interface RecordingJoinRow {
  id: string;
  title: string;
  description: string;
  bible_passage: string;
  duration_seconds: number;
  bitrate_kbps: number;
  created_at: string;
  display_name: string;
  slug: string;
  photo_key: string;
  is_verified: number;
}

export const RECORDING_JOIN_COLUMNS = `r.id, r.title, r.description, r.bible_passage, r.duration_seconds, r.bitrate_kbps, r.created_at,
  p.display_name, p.slug, p.photo_key, p.is_verified`;

export const RECORDING_JOINS = `FROM recordings r
  JOIN preacher_profiles p ON p.user_id = r.preacher_id
  JOIN "user" u ON u.id = r.preacher_id`;

export function toPublicRecording(row: RecordingJoinRow): PublicRecording {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    biblePassage: row.bible_passage,
    durationSeconds: row.duration_seconds,
    bitrateKbps: row.bitrate_kbps,
    createdAt: row.created_at,
    preacher: { name: row.display_name, slug: row.slug, photoUrl: photoUrl(row.photo_key), isVerified: Boolean(row.is_verified) },
  };
}

export async function listRecentRecordings(db: D1Database, { limit = 10, before }: { limit?: number; before?: string } = {}) {
  const { results } = await db
    .prepare(
      `SELECT ${RECORDING_JOIN_COLUMNS} ${RECORDING_JOINS}
        WHERE ${PUBLIC_RECORDING_FILTER} AND (?1 IS NULL OR r.created_at < ?1)
        ORDER BY r.created_at DESC LIMIT ?2`,
    )
    .bind(before ?? null, limit)
    .all<RecordingJoinRow>();
  return results.map(toPublicRecording);
}

export async function listPreacherRecordings(db: D1Database, preacherId: string, limit = 50) {
  const { results } = await db
    .prepare(
      `SELECT ${RECORDING_JOIN_COLUMNS} ${RECORDING_JOINS}
        WHERE ${PUBLIC_RECORDING_FILTER} AND r.preacher_id = ? ORDER BY r.created_at DESC LIMIT ?`,
    )
    .bind(preacherId, limit)
    .all<RecordingJoinRow>();
  return results.map(toPublicRecording);
}
