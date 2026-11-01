import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { ApiError } from "@/lib/api";
import { getViewer, requireRole, requireSession, toMe } from "@/modules/accounts/server/session";

function signedInAs(user: Partial<{ role: string; status: string; termsVersion: string }>) {
  getSession.mockResolvedValue({
    user: { id: "u1", name: "Ngozi", email: "ngozi@example.ng", image: null, role: "listener", status: "active", termsVersion: "", ...user },
  });
}

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 200;
  } catch (error) {
    return error instanceof ApiError ? error.status : 500;
  }
}

describe("session guards", () => {
  beforeEach(() => getSession.mockReset());

  it("returns null for visitors and 401 when a session is required", async () => {
    getSession.mockResolvedValue(null);
    expect(await getViewer()).toBeNull();
    expect(await statusOf(requireSession())).toBe(401);
  });

  it("refuses suspended and banned accounts", async () => {
    signedInAs({ status: "suspended" });
    expect(await statusOf(requireSession())).toBe(403);
    signedInAs({ status: "banned" });
    expect(await statusOf(requireSession())).toBe(403);
    signedInAs({ status: "warned" });
    expect(await statusOf(requireSession())).toBe(200);
  });

  it("checks roles, letting admins through", async () => {
    signedInAs({ role: "listener" });
    expect(await statusOf(requireRole("preacher"))).toBe(403);
    signedInAs({ role: "preacher" });
    expect(await statusOf(requireRole("preacher"))).toBe(200);
    signedInAs({ role: "admin" });
    expect(await statusOf(requireRole("preacher"))).toBe(200);
  });

  it("re-reads the session when asked for a fresh one", async () => {
    signedInAs({ role: "preacher" });
    await requireRole("preacher", { fresh: true });
    expect(getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }));
  });

  it("reports whether the current terms were accepted", async () => {
    signedInAs({ termsVersion: "2026-11-01" });
    const viewer = await requireSession();
    expect(toMe(viewer, "2026-11-01").hasAcceptedTerms).toBe(true);
    expect(toMe(viewer, "2027-01-01").hasAcceptedTerms).toBe(false);
  });
});
