import { describe, expect, it, vi } from "vitest";

import { createTestEnv } from "@/test/env";

const env = createTestEnv();
vi.mock("@/lib/cloudflare", () => ({ getEnv: () => env, getLimits: () => ({ freeMonthlyBroadcastMinutes: 600, freeRecordingLimit: 20, reconnectGraceSeconds: 60 }) }));

import { AccessToken } from "livekit-server-sdk";

import { POST } from "@/app/api/webhooks/livekit/route";

async function signed(body: string, secret = env.LIVEKIT_API_SECRET) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const token = new AccessToken(env.LIVEKIT_API_KEY, secret);
  token.sha256 = Buffer.from(digest).toString("base64");
  return token.toJwt();
}

describe("POST /api/webhooks/livekit", () => {
  const body = JSON.stringify({ event: "room_finished", room: { name: "unknown-room" } });

  it("refuses missing and tampered signatures", async () => {
    expect((await POST(new Request("http://x", { method: "POST", body }))).status).toBe(401);
    const forged = await signed(body, "wrong-secret-that-is-long-enough-for-hs256");
    expect((await POST(new Request("http://x", { method: "POST", body, headers: { authorization: forged } }))).status).toBe(401);
    const otherBody = await signed(JSON.stringify({ event: "room_finished" }));
    expect((await POST(new Request("http://x", { method: "POST", body, headers: { authorization: otherBody } }))).status).toBe(401);
  });

  it("accepts a valid signature", async () => {
    const response = await POST(new Request("http://x", { method: "POST", body, headers: { authorization: await signed(body) } }));
    expect(response.status).toBe(200);
  });
});
