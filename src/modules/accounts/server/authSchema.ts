/**
 * The parts of the Better Auth config that shape the database. Shared by the
 * runtime auth instance (lib/auth.ts) and scripts/auth-schema.ts, which prints
 * the SQL for migrations. Keep it free of `@/` imports and runtime secrets.
 */
import type { BetterAuthOptions } from "better-auth";

export const USER_ROLES = ["listener", "preacher", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "warned", "suspended", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const authUserFields = {
  role: { type: "string", required: false, defaultValue: "listener", input: false },
  status: { type: "string", required: false, defaultValue: "active", input: false },
  termsVersion: { type: "string", required: false, defaultValue: "", input: false },
} satisfies NonNullable<NonNullable<BetterAuthOptions["user"]>["additionalFields"]>;
