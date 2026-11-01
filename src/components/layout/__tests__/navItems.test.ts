import { describe, expect, it } from "vitest";

import { isNavItemActive, navItemsFor } from "@/components/layout/navItems";

describe("navItemsFor", () => {
  it("gives preachers Go live in the middle", () => {
    expect(navItemsFor("preacher").map((item) => item.label)).toEqual(["Home", "Search", "Go live", "Following", "You"]);
  });

  it("sends guests to sign in", () => {
    const labels = navItemsFor("guest").map((item) => `${item.label}:${item.href}`);
    expect(labels).toContain("Sign in:/login");
    expect(labels).not.toContain("Go live:/go-live");
  });
});

describe("isNavItemActive", () => {
  it("matches Home exactly and sections by prefix", () => {
    expect(isNavItemActive("/search", "/")).toBe(false);
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/following/recent", "/following")).toBe(true);
    expect(isNavItemActive("/followingx", "/following")).toBe(false);
  });
});
