import { describe, expect, it } from "vitest";

import { canChooseRoleNow, preacherApplicationRefusal } from "@/modules/accounts/server/policy";
import { authUserFields } from "@/modules/accounts/server/authSchema";

describe("auth fields", () => {
  it("never lets Better Auth's own endpoints set role, status or terms (privilege escalation)", () => {
    expect(authUserFields.role.input).toBe(false);
    expect(authUserFields.status.input).toBe(false);
    expect(authUserFields.termsVersion.input).toBe(false);
  });
});

describe("canChooseRoleNow", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  it("lets a new listener pick preacher within 24 hours", () => {
    expect(canChooseRoleNow({ role: "listener", createdAt: "2026-11-02T00:00:00Z", hasPreacherProfile: false }, now)).toBe(true);
  });
  it("sends older accounts and non-listeners to the application", () => {
    expect(canChooseRoleNow({ role: "listener", createdAt: "2026-10-30T00:00:00Z", hasPreacherProfile: false }, now)).toBe(false);
    expect(canChooseRoleNow({ role: "preacher", createdAt: "2026-11-02T00:00:00Z", hasPreacherProfile: false }, now)).toBe(false);
  });
});

describe("preacherApplicationRefusal", () => {
  it("refuses non-listeners and second pending applications", () => {
    expect(preacherApplicationRefusal({ role: "preacher", hasPendingApplication: false })).toBe("not_listener");
    expect(preacherApplicationRefusal({ role: "listener", hasPendingApplication: true })).toBe("already_pending");
    expect(preacherApplicationRefusal({ role: "listener", hasPendingApplication: false })).toBeNull();
  });
});
