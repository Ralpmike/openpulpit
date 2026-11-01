import "server-only";

import type { Broadcast } from "@/modules/broadcasting/models";
import type { BroadcastSpan } from "@/modules/broadcasting/server/policy";

export interface BroadcastRow {
  id: string;
  preacher_id: string;
  title: string;
  description: string;
  bible_passage: string;
  status: Broadcast["status"];
  ended_reason: Broadcast["endedReason"];
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  publisher_left_at: string | null;
  hours_warning_at: string | null;
  peak_listeners: number;
  current_listeners: number;
}

export const BROADCAST_COLUMNS =
  "id, preacher_id, title, description, bible_passage, status, ended_reason, created_at, started_at, ended_at, publisher_left_at, hours_warning_at, peak_listeners, current_listeners";

export function toBroadcast(row: BroadcastRow): Broadcast {
  return {
    id: row.id,
    preacherId: row.preacher_id,
    title: row.title,
    description: row.description,
    biblePassage: row.bible_passage,
    status: row.status,
    endedReason: row.ended_reason,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    peakListeners: row.peak_listeners,
    currentListeners: row.current_listeners,
  };
}

export async function insertBroadcast(
  db: D1Database,
  broadcast: { id: string; preacherId: string; title: string; description: string; biblePassage: string },
): Promise<void> {
  await db
    .prepare("INSERT INTO broadcasts (id, preacher_id, title, description, bible_passage) VALUES (?, ?, ?, ?, ?)")
    .bind(broadcast.id, broadcast.preacherId, broadcast.title, broadcast.description, broadcast.biblePassage)
    .run();
}

export async function getBroadcast(db: D1Database, id: string): Promise<BroadcastRow | null> {
  return db.prepare(`SELECT ${BROADCAST_COLUMNS} FROM broadcasts WHERE id = ?`).bind(id).first();
}

/** Ownership is part of the query, never checked after loading. */
export async function getOwnedBroadcast(db: D1Database, id: string, preacherId: string): Promise<BroadcastRow | null> {
  return db.prepare(`SELECT ${BROADCAST_COLUMNS} FROM broadcasts WHERE id = ? AND preacher_id = ?`).bind(id, preacherId).first();
}

export async function hasOtherLiveBroadcast(db: D1Database, preacherId: string, exceptId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS live FROM broadcasts WHERE preacher_id = ? AND status = 'live' AND id <> ?")
    .bind(preacherId, exceptId)
    .first();
  return Boolean(row);
}

export async function broadcastSpansSince(db: D1Database, preacherId: string, since: Date): Promise<BroadcastSpan[]> {
  const { results } = await db
    .prepare(
      `SELECT started_at AS startedAt, ended_at AS endedAt FROM broadcasts
        WHERE preacher_id = ? AND started_at >= ?`,
    )
    .bind(preacherId, since.toISOString())
    .all<BroadcastSpan>();
  return results;
}
