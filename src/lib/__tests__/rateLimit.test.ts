import { describe, expect, it } from "vitest";

import { consumeRateLimit } from "@/lib/rateLimit";
import { createTestD1 } from "@/test/d1";

const rule = { window: 60, max: 2 };
const now = Date.UTC(2026, 10, 1, 9, 0, 10);

describe("consumeRateLimit", () => {
  it("allows up to the limit in a window, then says when to retry", async () => {
    const db = createTestD1();
    const options = { salt: "s", now };
    expect((await consumeRateLimit(db, "ip:1.2.3.4", rule, options)).allowed).toBe(true);
    expect((await consumeRateLimit(db, "ip:1.2.3.4", rule, options)).allowed).toBe(true);
    expect(await consumeRateLimit(db, "ip:1.2.3.4", rule, options)).toEqual({ allowed: false, retryAfter: 50 });
  });

  it("starts again in the next window and keeps keys apart", async () => {
    const db = createTestD1();
    await consumeRateLimit(db, "k", rule, { salt: "s", now });
    await consumeRateLimit(db, "k", rule, { salt: "s", now });
    expect((await consumeRateLimit(db, "other", rule, { salt: "s", now })).allowed).toBe(true);
    expect((await consumeRateLimit(db, "k", rule, { salt: "s", now: now + 60_000 })).allowed).toBe(true);
  });

  it("never stores the raw key", async () => {
    const db = createTestD1();
    await consumeRateLimit(db, "ip:102.89.1.1", rule, { salt: "s", now });
    const keys = db.sqlite.prepare("SELECT key FROM rate_limits").all() as { key: string }[];
    expect(keys[0]!.key).not.toContain("102.89");
    expect(keys[0]!.key).toMatch(/^[0-9a-f]{64}$/);
  });
});
