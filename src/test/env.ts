import { createTestD1, type TestD1 } from "@/test/d1";

/** A CloudflareEnv for service tests: real schema, test LiveKit keys, default limits. */
export function createTestEnv(overrides: Partial<CloudflareEnv> = {}): CloudflareEnv & { DB: TestD1 } {
  return {
    DB: createTestD1(),
    APP_ENV: "local",
    APP_URL: "http://localhost:3000",
    LIVEKIT_URL: "wss://livekit.test",
    LIVEKIT_API_KEY: "test-key",
    LIVEKIT_API_SECRET: "test-secret-that-is-long-enough-for-hs256",
    FREE_MONTHLY_BROADCAST_MINUTES: "600",
    FREE_RECORDING_LIMIT: "20",
    RECONNECT_GRACE_SECONDS: "60",
    RATE_LIMIT_SALT: "salt",
    BETTER_AUTH_SECRET: "secret",
    ...overrides,
  } as CloudflareEnv & { DB: TestD1 };
}

/** Reads a JWT's claims (tests only; LiveKit verifies the signature). */
export function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split(".")[1]!;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}
