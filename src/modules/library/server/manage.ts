import "server-only";

import { conflict, forbidden, notFound } from "@/lib/api";
import { nowIso } from "@/lib/ids";
import type { Viewer } from "@/modules/accounts";
import type { MyRecording, RecordingVisibility } from "@/modules/library/models";

interface OwnedRow {
  id: string;
  r2_key: string;
  created_at: string;
  status: MyRecording["status"];
  visibility: RecordingVisibility;
}

/** Ownership is in the query (broadcasting-rules): another preacher's recording is simply not found. */
async function getOwned(db: D1Database, viewer: Viewer, id: string): Promise<OwnedRow> {
  const row = await db
    .prepare("SELECT id, r2_key, status, visibility, created_at FROM recordings WHERE id = ? AND preacher_id = ? AND status <> 'deleted'")
    .bind(id, viewer.id)
    .first<OwnedRow>();
  if (!row) throw notFound("We couldn't find that recording.");
  return row;
}

export async function listMyRecordings(db: D1Database, viewer: Viewer): Promise<MyRecording[]> {
  const { results } = await db
    .prepare(
      `SELECT r.id, r.title, r.description, r.bible_passage, r.status, r.visibility, r.duration_seconds, r.created_at,
              r.replay_count, b.peak_listeners
         FROM recordings r JOIN broadcasts b ON b.id = r.broadcast_id
        WHERE r.preacher_id = ? AND r.status <> 'deleted'
        ORDER BY r.created_at DESC LIMIT 100`,
    )
    .bind(viewer.id)
    .all<{
      id: string; title: string; description: string; bible_passage: string; status: MyRecording["status"];
      visibility: RecordingVisibility; duration_seconds: number; created_at: string; replay_count: number; peak_listeners: number;
    }>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    biblePassage: row.bible_passage,
    status: row.status,
    visibility: row.visibility,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    replayCount: row.replay_count,
    peakListeners: row.peak_listeners,
  }));
}

export async function updateMyRecording(
  db: D1Database,
  viewer: Viewer,
  id: string,
  details: { title: string; description: string; biblePassage: string },
): Promise<void> {
  await getOwned(db, viewer, id);
  await db
    .prepare("UPDATE recordings SET title = ?, description = ?, bible_passage = ? WHERE id = ? AND preacher_id = ?")
    .bind(details.title, details.description, details.biblePassage, id, viewer.id)
    .run();
}

/** A preacher hides or unhides their own recording, never one an admin hid. */
export async function setMyRecordingHidden(db: D1Database, viewer: Viewer, id: string, isHidden: boolean): Promise<RecordingVisibility> {
  const row = await getOwned(db, viewer, id);
  if (row.visibility === "hidden_by_admin") {
    throw forbidden("Our team hid this recording. Contact us if you think it was a mistake.");
  }
  const visibility: RecordingVisibility = isHidden ? "hidden_by_preacher" : "public";
  await db
    .prepare("UPDATE recordings SET visibility = ? WHERE id = ? AND preacher_id = ? AND visibility <> 'hidden_by_admin'")
    .bind(visibility, id, viewer.id)
    .run();
  return visibility;
}

/**
 * Delete: the row says "deleted" first, then the file goes from R2, so a
 * failure in between never leaves a listed recording without its audio.
 * Stats and the broadcast stay.
 */
export async function deleteRecordingFile(db: D1Database, bucket: R2Bucket, row: { id: string; r2_key: string }) {
  await db.prepare("UPDATE recordings SET status = 'deleted', deleted_at = ? WHERE id = ? AND status <> 'deleted'").bind(nowIso(), row.id).run();
  await bucket.delete(row.r2_key);
}

export async function deleteMyRecording(db: D1Database, bucket: R2Bucket, viewer: Viewer, id: string): Promise<void> {
  const row = await getOwned(db, viewer, id);
  // A recording still saving can't be deleted, unless it has been stuck for over an hour.
  const isStuck = Date.now() - new Date(row.created_at).getTime() > 60 * 60 * 1000;
  if (row.status === "processing" && !isStuck) throw conflict("This recording is still being saved. Try again in a minute.");
  await deleteRecordingFile(db, bucket, row);
}
