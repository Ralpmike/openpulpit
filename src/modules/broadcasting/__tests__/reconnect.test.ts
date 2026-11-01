import { describe, expect, it } from "vitest";

import { FINAL_DISCONNECT_REASONS, rejoinDelay, shouldKeepRejoining } from "@/modules/broadcasting/reconnect";

describe("reconnect rules", () => {
  it("backs off 1, 2, 4, 8 then every 15 seconds", () => {
    expect([0, 1, 2, 3, 4, 9].map(rejoinDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
  });

  it("keeps trying only within the grace window and never after leaving on purpose", () => {
    const droppedAt = 1_000_000;
    expect(shouldKeepRejoining({ droppedAt, now: droppedAt + 30_000, graceSeconds: 60, wasIntentional: false })).toBe(true);
    expect(shouldKeepRejoining({ droppedAt, now: droppedAt + 60_000, graceSeconds: 60, wasIntentional: false })).toBe(false);
    expect(shouldKeepRejoining({ droppedAt, now: droppedAt + 1_000, graceSeconds: 60, wasIntentional: true })).toBe(false);
  });

  it("doesn't rejoin a room that was deleted (ended) or after being removed", () => {
    expect(FINAL_DISCONNECT_REASONS.has(5)).toBe(true);
    expect(FINAL_DISCONNECT_REASONS.has(4)).toBe(true);
  });
});
