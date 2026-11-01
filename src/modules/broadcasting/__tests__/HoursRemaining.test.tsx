// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatDayMonth, formatRelative } from "@/helpers/format/date";
import { HoursRemaining } from "@/modules/broadcasting/components/HoursRemaining";

const renewsAt = "2026-11-30T23:00:00.000Z";

describe("HoursRemaining", () => {
  it("shows hours left and when they renew, in Lagos time", () => {
    render(<HoursRemaining isLoading={false} isError={false} hours={{ capSeconds: 36000, usedSeconds: 5400, remainingSeconds: 30600, renewsAt }} />);
    expect(screen.getByTestId("hours-remaining")).toHaveTextContent("8 h 30 min left this month");
    expect(screen.getByTestId("hours-remaining")).toHaveTextContent("Renews on 1 December");
  });

  it("says plainly when the hours are used up", () => {
    render(<HoursRemaining isLoading={false} isError={false} hours={{ capSeconds: 36000, usedSeconds: 36000, remainingSeconds: 0, renewsAt }} />);
    expect(screen.getByTestId("hours-used-up")).toHaveTextContent("No broadcast hours left this month");
  });
});

describe("date helpers", () => {
  it("formats in Lagos time and relative words", () => {
    expect(formatDayMonth("2026-10-31T23:30:00Z")).toBe("1 November");
    expect(formatRelative("2026-11-01T10:00:00Z", new Date("2026-11-01T12:00:00Z"))).toBe("2 hours ago");
    expect(formatRelative("2026-10-29T12:00:00Z", new Date("2026-11-01T12:00:00Z"))).toBe("3 days ago");
  });
});
