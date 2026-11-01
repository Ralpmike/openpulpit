/**
 * Fixed-window rate limits stored in D1 (`rate_limits`). Keys are hashed with a
 * secret salt so no raw IP address or email is ever stored (NDPA 2023).
 * The check and the increment are one UPSERT, so concurrent requests can't
 * slip past a stale read.
 */
export interface RateLimitRule {
  /** Window length in seconds. */
  window: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number | null;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashRateLimitKey(key: string, salt: string): Promise<string> {
  return sha256(`${salt}:${key}`);
}

export async function consumeRateLimit(
  db: D1Database,
  key: string,
  rule: RateLimitRule,
  { salt, now = Date.now() }: { salt: string; now?: number },
): Promise<RateLimitResult> {
  const nowSeconds = Math.floor(now / 1000);
  const windowStart = nowSeconds - (nowSeconds % rule.window);
  const hashed = await hashRateLimitKey(key, salt);
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(hashed, String(windowStart))
    .first<{ count: number }>();
  // Old windows are cleared now and then, never on every request.
  if (Math.random() < 0.01) {
    await db
      .prepare("DELETE FROM rate_limits WHERE CAST(window_start AS INTEGER) < ?")
      .bind(nowSeconds - 86_400)
      .run();
  }
  const count = row?.count ?? 1;
  if (count <= rule.max) return { allowed: true, retryAfter: null };
  return { allowed: false, retryAfter: windowStart + rule.window - nowSeconds };
}
