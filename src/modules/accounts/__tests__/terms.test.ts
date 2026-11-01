import { describe, expect, it } from "vitest";

import type { Viewer } from "@/modules/accounts/server/session";
import { acceptTerms, requireAcceptedTerms } from "@/modules/accounts/server/terms";
import { CURRENT_TERMS_VERSION } from "@/modules/accounts/terms";
import { createTestD1, insertUser } from "@/test/d1";

const viewer: Viewer = { id: "u1", name: "Ngozi", email: "n@x.ng", image: null, role: "listener", status: "active", termsVersion: "" };

describe("terms of use", () => {
  it("records the accepted version and refuses an old one", async () => {
    const db = createTestD1();
    insertUser(db, { id: "u1" });
    await expect(acceptTerms(db, viewer, "2020-01-01")).rejects.toMatchObject({ status: 409 });
    await acceptTerms(db, viewer, CURRENT_TERMS_VERSION);
    expect(db.sqlite.prepare(`SELECT termsVersion FROM "user" WHERE id = 'u1'`).get()).toEqual({ termsVersion: CURRENT_TERMS_VERSION });
  });

  it("blocks going live, following and reporting until accepted", () => {
    expect(() => requireAcceptedTerms(viewer)).toThrow(/accept the terms/);
    expect(() => requireAcceptedTerms({ ...viewer, termsVersion: CURRENT_TERMS_VERSION })).not.toThrow();
  });
});
