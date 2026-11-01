import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/schemas/common";
import { emailCodeVerifySchema, signUpSchema } from "@/modules/accounts/schemas/auth";

describe("auth schemas", () => {
  it("accepts a valid sign-up and normalises the email", () => {
    const parsed = signUpSchema.parse({ name: "Ada Obi", email: " Ada@Example.NG ", password: "longenough", role: "listener" });
    expect(parsed.email).toBe("ada@example.ng");
  });

  it("rejects short passwords, bad emails and empty names", () => {
    expect(signUpSchema.safeParse({ name: "A", email: "ada@example.ng", password: "longenough", role: "listener" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ada", email: "not-an-email", password: "longenough" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ada", email: "ada@example.ng", password: "short" }).success).toBe(false);
  });

  it("accepts only 6-digit codes", () => {
    expect(emailCodeVerifySchema.safeParse({ otp: "123456" }).success).toBe(true);
    expect(emailCodeVerifySchema.safeParse({ otp: "12345a" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths and refuses anything else", () => {
    expect(safeNextPath("/go-live")).toBe("/go-live");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null, "/account")).toBe("/account");
  });
});

describe("role choice", () => {
  it("never accepts admin at sign-up", () => {
    expect(signUpSchema.safeParse({ name: "Ada", email: "ada@example.ng", password: "longenough", role: "admin" }).success).toBe(false);
  });
});
