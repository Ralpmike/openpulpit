import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/modules/accounts/server/password";

describe("password hashing", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("Psalm 23 is my favourite");
    expect(hash).toMatch(/^pbkdf2\$100000\$/);
    expect(await verifyPassword({ hash, password: "Psalm 23 is my favourite" })).toBe(true);
    expect(await verifyPassword({ hash, password: "psalm 23 is my favourite" })).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword({ hash: "scrypt$abc", password: "x" })).toBe(false);
  });
});
