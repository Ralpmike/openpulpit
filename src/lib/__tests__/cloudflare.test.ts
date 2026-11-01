import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));

import { getLimits } from "@/lib/cloudflare";

const env = (vars: Partial<CloudflareEnv>) => vars as CloudflareEnv;

describe("getLimits", () => {
  it("reads the free-tier limits from wrangler vars", () => {
    expect(
      getLimits(env({ FREE_MONTHLY_BROADCAST_MINUTES: "600", FREE_RECORDING_LIMIT: "20", RECONNECT_GRACE_SECONDS: "60" })),
    ).toEqual({ freeMonthlyBroadcastMinutes: 600, freeRecordingLimit: 20, reconnectGraceSeconds: 60 });
  });

  it("falls back to the PRD defaults when a var is missing or invalid", () => {
    expect(getLimits(env({ FREE_MONTHLY_BROADCAST_MINUTES: "lots", FREE_RECORDING_LIMIT: "-1" }))).toEqual({
      freeMonthlyBroadcastMinutes: 600,
      freeRecordingLimit: 20,
      reconnectGraceSeconds: 60,
    });
  });
});
