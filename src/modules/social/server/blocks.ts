import "server-only";

import { conflict, notFound } from "@/lib/api";
import type { Viewer } from "@/modules/accounts";

export interface FollowerRow {
  id: string;
  name: string;
  image: string | null;
  followedAt: string;
}

/** A preacher's followers, newest first. Names only: no emails (NDPA). */
export async function listMyFollowers(db: D1Database, preacher: Viewer, limit = 200): Promise<FollowerRow[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.name, u.image, f.created_at FROM follows f JOIN "user" u ON u.id = f.listener_id
        WHERE f.preacher_id = ? ORDER BY f.created_at DESC LIMIT ?`,
    )
    .bind(preacher.id, limit)
    .all<{ id: string; name: string; image: string | null; created_at: string }>();
  return results.map((row) => ({ id: row.id, name: row.name, image: row.image, followedAt: row.created_at }));
}

export async function listMyBlocks(db: D1Database, preacher: Viewer): Promise<FollowerRow[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.name, u.image, b.created_at FROM blocks b JOIN "user" u ON u.id = b.listener_id
        WHERE b.preacher_id = ? ORDER BY b.created_at DESC`,
    )
    .bind(preacher.id)
    .all<{ id: string; name: string; image: string | null; created_at: string }>();
  return results.map((row) => ({ id: row.id, name: row.name, image: row.image, followedAt: row.created_at }));
}

/**
 * Block a listener (requirement 27): the follow goes in the same batch, they
 * can't follow again and get no notifications. Listening stays public.
 */
export async function blockListener(db: D1Database, preacher: Viewer, listenerId: string): Promise<void> {
  if (listenerId === preacher.id) throw conflict("You can't block yourself.");
  const listener = await db.prepare(`SELECT id FROM "user" WHERE id = ?`).bind(listenerId).first();
  if (!listener) throw notFound("We couldn't find that person.");
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO blocks (preacher_id, listener_id) VALUES (?, ?)").bind(preacher.id, listenerId),
    db.prepare("DELETE FROM follows WHERE preacher_id = ? AND listener_id = ?").bind(preacher.id, listenerId),
  ]);
}

export async function unblockListener(db: D1Database, preacher: Viewer, listenerId: string): Promise<void> {
  await db.prepare("DELETE FROM blocks WHERE preacher_id = ? AND listener_id = ?").bind(preacher.id, listenerId).run();
}
