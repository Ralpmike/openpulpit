/** Pure account rules. Tested in accounts/__tests__/policy.test.ts. */
import type { UserRole } from "@/modules/accounts/server/authSchema";

/** How long after sign-up a new account may still pick "preacher" without applying. */
export const ROLE_CHOICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function canChooseRoleNow(
  account: { role: UserRole; createdAt: string; hasPreacherProfile: boolean },
  now: Date = new Date(),
): boolean {
  if (account.role !== "listener" || account.hasPreacherProfile) return false;
  const age = now.getTime() - new Date(account.createdAt).getTime();
  return age >= 0 && age <= ROLE_CHOICE_WINDOW_MS;
}

export type ApplicationRefusal = "not_listener" | "already_pending" | null;

export function preacherApplicationRefusal(account: { role: UserRole; hasPendingApplication: boolean }): ApplicationRefusal {
  if (account.role !== "listener") return "not_listener";
  if (account.hasPendingApplication) return "already_pending";
  return null;
}
