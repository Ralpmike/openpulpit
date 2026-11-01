import "server-only";

import { notFound } from "@/lib/api";
import { nowIso } from "@/lib/ids";
import type { Viewer } from "@/modules/accounts";
import { PUBLIC_RECORDING_FILTER, RECORDING_JOIN_COLUMNS, RECORDING_JOINS, toPublicRecording } from "@/modules/library/server/queries";
import type { PublicRecording } from "@/modules/library/models";

/**
 * A recording people may play: ready + public + preacher in good standing,
 * or the owner / an admin (who can still hear hidden ones).
 */
export async function getPlayableRecording(
  db: D1Database,
  id: string,
  viewer: Viewer | null,
): Promise<(PublicRecording & { r2Key: string; isPublic: boolean }) | null> {
  const row = await db
    .prepare(
      `SELECT ${RECORDING_JOIN_COLUMNS}, r.r2_key, r.preacher_id, r.status, (${PUBLIC_RECORDING_FILTER}) AS is_public
         ${RECORDING_JOINS} WHERE r.id = ? AND r.status = 'ready'`,
    )
    .bind(id)
    .first<Parameters<typeof toPublicRecording>[0] & { r2_key: string; preacher_id: string; is_public: number }>();
  if (!row) return null;
  const isPublic = Boolean(row.is_public);
  const canSeeHidden = viewer && (viewer.role === "admin" || viewer.id === row.preacher_id);
  if (!isPublic && !canSeeHidden) return null;
  return { ...toPublicRecording(row), r2Key: row.r2_key, isPublic };
}

export function parseRange(header: string | null, size: number): { offset: number; length: number } | null | "invalid" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return "invalid";
  const [, startText, endText] = match;
  let start: number;
  let end: number;
  if (startText === "") {
    const suffix = Number(endText);
    if (!suffix) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText === "" ? size - 1 : Math.min(Number(endText), size - 1);
  }
  if (start > end || start >= size) return "invalid";
  return { offset: start, length: end - start + 1 };
}

/** Streams a recording from private R2, with Range support for seeking (requirement 21). */
export async function streamRecording(bucket: R2Bucket, key: string, rangeHeader: string | null): Promise<Response> {
  const head = await bucket.head(key);
  if (!head) throw notFound("We couldn't find that recording.");
  const range = parseRange(rangeHeader, head.size);
  const headers: Record<string, string> = {
    "content-type": head.httpMetadata?.contentType || "audio/ogg",
    "accept-ranges": "bytes",
    // Private: hidden-ness and deletion must take effect, so no shared caches.
    "cache-control": "private, max-age=3600",
    etag: head.httpEtag,
  };
  if (range === "invalid") {
    return new Response(null, { status: 416, headers: { ...headers, "content-range": `bytes */${head.size}` } });
  }
  const object = await bucket.get(key, range ? { range } : undefined);
  if (!object) throw notFound("We couldn't find that recording.");
  if (!range) return new Response(object.body, { headers: { ...headers, "content-length": String(head.size) } });
  return new Response(object.body, {
    status: 206,
    headers: {
      ...headers,
      "content-length": String(range.length),
      "content-range": `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`,
    },
  });
}

/** Resume where a signed-in listener stopped (requirement 21). */
export async function savePosition(db: D1Database, viewer: Viewer, recordingId: string, positionSeconds: number) {
  await db
    .prepare(
      `INSERT INTO playback_positions (user_id, recording_id, position_seconds, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, recording_id) DO UPDATE SET position_seconds = excluded.position_seconds, updated_at = excluded.updated_at`,
    )
    .bind(viewer.id, recordingId, Math.max(0, Math.floor(positionSeconds)), nowIso())
    .run();
}

export async function getPosition(db: D1Database, viewer: Viewer, recordingId: string): Promise<number> {
  const row = await db
    .prepare("SELECT position_seconds FROM playback_positions WHERE user_id = ? AND recording_id = ?")
    .bind(viewer.id, recordingId)
    .first<{ position_seconds: number }>();
  return row?.position_seconds ?? 0;
}
