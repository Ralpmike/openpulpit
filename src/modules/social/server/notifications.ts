import "server-only";

import { nowIso } from "@/lib/ids";
import { sendPush, type PushResult, type VapidKeys } from "@/lib/webPush";

export interface GoLiveBroadcast {
  id: string;
  preacher_id: string;
  title: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function vapidKeysFrom(env: CloudflareEnv): VapidKeys | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
  return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT || "mailto:hello@openpulpit.app" };
}

/**
 * One web push per broadcast to followers who want it (requirements 17–18):
 * claimed in notifications_sent first, so retries and reconnects never send twice;
 * muted and blocked followers left out; gone subscriptions deleted.
 */
export async function notifyFollowersOfLive(
  env: CloudflareEnv,
  broadcast: GoLiveBroadcast,
  { send = sendPush, concurrency = 10 }: { send?: typeof sendPush; concurrency?: number } = {},
): Promise<{ sent: number; removed: number; skipped: boolean }> {
  const db = env.DB;
  const claim = await db.prepare("INSERT OR IGNORE INTO notifications_sent (broadcast_id) VALUES (?)").bind(broadcast.id).run();
  if (!claim.meta.changes) return { sent: 0, removed: 0, skipped: true };
  const keys = vapidKeysFrom(env);
  if (!keys) return { sent: 0, removed: 0, skipped: true };

  const preacher = await db
    .prepare("SELECT display_name, slug, photo_key FROM preacher_profiles WHERE user_id = ?")
    .bind(broadcast.preacher_id)
    .first<{ display_name: string; slug: string; photo_key: string }>();
  const { results: subscriptions } = await db
    .prepare(
      `SELECT s.id, s.endpoint, s.p256dh, s.auth
         FROM follows f
         JOIN push_subscriptions s ON s.user_id = f.listener_id
         JOIN "user" u ON u.id = f.listener_id
        WHERE f.preacher_id = ?1 AND f.notifications_enabled = 1 AND u.status IN ('active', 'warned')
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.preacher_id = ?1 AND b.listener_id = f.listener_id)`,
    )
    .bind(broadcast.preacher_id)
    .all<SubscriptionRow>();

  const payload = {
    title: `${preacher?.display_name ?? "A preacher you follow"} is live`,
    body: broadcast.title,
    url: `/live/${broadcast.id}`,
    tag: `live-${broadcast.id}`,
    icon: preacher?.photo_key ? `/api/media/${preacher.photo_key}` : "/icons/icon-192.png",
  };

  let sent = 0;
  const gone: string[] = [];
  for (let i = 0; i < subscriptions.length; i += concurrency) {
    const batch = subscriptions.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map((subscription) => send(subscription, payload, keys)));
    results.forEach((result, index) => {
      const outcome: PushResult = result.status === "fulfilled" ? result.value : "failed";
      if (outcome === "sent") sent++;
      if (outcome === "gone") gone.push(batch[index]!.id);
    });
  }
  const statements = gone.map((id) => db.prepare("DELETE FROM push_subscriptions WHERE id = ?").bind(id));
  statements.push(db.prepare("UPDATE notifications_sent SET recipient_count = ? WHERE broadcast_id = ?").bind(sent, broadcast.id));
  if (sent) {
    // A subquery, not one parameter per subscription: D1 allows at most 100 bound parameters.
    statements.push(
      db
        .prepare(
          `UPDATE push_subscriptions SET last_used_at = ?1 WHERE user_id IN (
             SELECT f.listener_id FROM follows f WHERE f.preacher_id = ?2 AND f.notifications_enabled = 1)`,
        )
        .bind(nowIso(), broadcast.preacher_id),
    );
  }
  await db.batch(statements);
  return { sent, removed: gone.length, skipped: false };
}

export async function saveSubscription(
  db: D1Database,
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
    .bind(crypto.randomUUID(), userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth)
    .run();
}

export async function deleteSubscription(db: D1Database, userId: string, endpoint: string): Promise<void> {
  await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?").bind(endpoint, userId).run();
}
