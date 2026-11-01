import { describe, expect, it } from "vitest";

import { loginRedirectUrl } from "@/helpers/api/baseQuery";

describe("loginRedirectUrl", () => {
  it("sends people back to where they were after signing in", () => {
    expect(loginRedirectUrl("/go-live?draft=1")).toBe("/login?next=%2Fgo-live%3Fdraft%3D1");
  });
});
