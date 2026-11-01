import { describe, expect, it } from "vitest";

import { formatClock, formatDuration, spokenDuration } from "@/helpers/format/duration";

describe("durations", () => {
  it("formats a live clock", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(3723)).toBe("1:02:03");
  });
  it("formats hours and minutes in words", () => {
    expect(formatDuration(3900)).toBe("1 h 5 min");
    expect(formatDuration(36000)).toBe("10 h");
    expect(formatDuration(30)).toBe("less than a minute");
    expect(spokenDuration(3723)).toBe("1 hour 2 minutes");
    expect(spokenDuration(60)).toBe("1 minute");
  });
});
