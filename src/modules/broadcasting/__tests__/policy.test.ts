import { describe, expect, it } from "vitest";

import { dataUseLabel, mbPerHour, recordingDataLabel } from "@/helpers/audio/dataUse";
import { lagosDay, lagosMonthStart, nextLagosMonthStart } from "@/helpers/time/lagos";
import { hoursAction, publishRefusal, remainingSeconds, usedSeconds, type PublishCheck } from "@/modules/broadcasting/server/policy";

const ok: PublishCheck = {
  role: "preacher", status: "active", isOwner: true, broadcastStatus: "ready", remainingSeconds: 3600, hasOtherLiveBroadcast: false,
};

describe("publishRefusal", () => {
  it("allows a preacher in good standing with hours left on their own broadcast", () => {
    expect(publishRefusal(ok)).toBeNull();
    expect(publishRefusal({ ...ok, broadcastStatus: "live" })).toBeNull();
    expect(publishRefusal({ ...ok, status: "warned" })).toBeNull();
  });

  it("refuses each failing check", () => {
    expect(publishRefusal({ ...ok, role: "listener" })).toBe("not_preacher");
    expect(publishRefusal({ ...ok, status: "suspended" })).toBe("suspended");
    expect(publishRefusal({ ...ok, status: "banned" })).toBe("suspended");
    expect(publishRefusal({ ...ok, isOwner: false })).toBe("not_owner");
    expect(publishRefusal({ ...ok, broadcastStatus: "ended" })).toBe("ended");
    expect(publishRefusal({ ...ok, remainingSeconds: 0 })).toBe("no_hours_left");
    expect(publishRefusal({ ...ok, hasOtherLiveBroadcast: true })).toBe("already_live");
  });
});

describe("hours cap in Lagos months", () => {
  it("starts the month at Lagos midnight, not UTC midnight", () => {
    // 23:30 UTC on 31 Oct is 00:30 on 1 Nov in Lagos.
    expect(lagosMonthStart(new Date("2026-10-31T23:30:00Z")).toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(lagosMonthStart(new Date("2026-10-31T22:30:00Z")).toISOString()).toBe("2026-09-30T23:00:00.000Z");
    expect(nextLagosMonthStart(new Date("2026-12-15T12:00:00Z")).toISOString()).toBe("2026-12-31T23:00:00.000Z");
    expect(lagosDay(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });

  it("counts this month's broadcasts and the running one, by start month", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const since = lagosMonthStart(now);
    const spans = [
      { startedAt: "2026-11-02T09:00:00Z", endedAt: "2026-11-02T10:00:00Z" }, // 1 h
      { startedAt: "2026-10-31T22:30:00Z", endedAt: "2026-10-31T23:30:00Z" }, // started in October (Lagos)
      { startedAt: "2026-11-10T11:30:00Z", endedAt: null }, // live: 30 min so far
      { startedAt: null, endedAt: null },
    ];
    expect(usedSeconds(spans, since, now)).toBe(5400);
    expect(remainingSeconds(600, 5400)).toBe(30600);
    expect(remainingSeconds(60, 5400)).toBe(0);
  });

  it("warns once at 10 minutes left and ends at zero", () => {
    expect(hoursAction(700, false)).toBe("none");
    expect(hoursAction(600, false)).toBe("warn");
    expect(hoursAction(300, true)).toBe("none");
    expect(hoursAction(0, true)).toBe("end");
  });
});

describe("data budget", () => {
  it("keeps the default under 15 MB an hour", () => {
    expect(mbPerHour(32)).toBe(14.4);
    expect(dataUseLabel()).toBe("About 14 MB per hour");
    expect(dataUseLabel(64)).toBe("About 30 MB per hour");
    expect(recordingDataLabel(2700)).toBe("About 11 MB");
    expect(recordingDataLabel(120)).toBe("Less than 1 MB");
  });
});
