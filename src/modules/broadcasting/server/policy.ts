/**
 * Pure broadcasting rules (see the broadcasting-rules skill). Route handlers
 * and webhooks call these; the client only displays their results.
 */
import type { UserRole, UserStatus } from "@/modules/accounts";

export type BroadcastStatus = "ready" | "live" | "ended";
export type EndedReason = "preacher" | "disconnected" | "hours_cap" | "admin" | "error";

export type PublishRefusal =
  | "not_preacher"
  | "suspended"
  | "not_owner"
  | "ended"
  | "no_hours_left"
  | "already_live";

export interface PublishCheck {
  role: UserRole;
  status: UserStatus;
  isOwner: boolean;
  broadcastStatus: BroadcastStatus;
  remainingSeconds: number;
  /** Another broadcast of this preacher is live right now. */
  hasOtherLiveBroadcast: boolean;
}

/** The checks for a publish token, in the order the skill lists them. */
export function publishRefusal(check: PublishCheck): PublishRefusal | null {
  if (check.role !== "preacher" && check.role !== "admin") return "not_preacher";
  if (check.status === "suspended" || check.status === "banned") return "suspended";
  if (!check.isOwner) return "not_owner";
  if (check.broadcastStatus === "ended") return "ended";
  if (check.remainingSeconds <= 0) return "no_hours_left";
  if (check.hasOtherLiveBroadcast) return "already_live";
  return null;
}

export const PUBLISH_REFUSAL_MESSAGES: Record<PublishRefusal, { status: number; message: string }> = {
  not_preacher: { status: 403, message: "Only preachers can go live." },
  suspended: { status: 403, message: "Your account can't go live while it is suspended." },
  not_owner: { status: 404, message: "We couldn't find that broadcast." },
  ended: { status: 409, message: "This broadcast has ended. Start a new one." },
  no_hours_left: { status: 403, message: "You've used this month's broadcast hours. They renew on the 1st." },
  already_live: { status: 409, message: "You're already live in another broadcast. End it first." },
};

export interface BroadcastSpan {
  startedAt: string | null;
  endedAt: string | null;
}

/** Seconds broadcast in the period from `since`, counting a live broadcast up to `now`. */
export function usedSeconds(spans: BroadcastSpan[], since: Date, now: Date): number {
  let total = 0;
  for (const span of spans) {
    if (!span.startedAt) continue;
    const start = new Date(span.startedAt).getTime();
    // A broadcast counts towards the month it started in.
    if (start < since.getTime()) continue;
    const end = span.endedAt ? new Date(span.endedAt).getTime() : now.getTime();
    total += Math.max(0, Math.floor((end - start) / 1000));
  }
  return total;
}

export function remainingSeconds(capMinutes: number, used: number): number {
  return Math.max(0, capMinutes * 60 - used);
}

/** When to warn and when to end a live broadcast because the month's hours run out. */
export const HOURS_WARNING_SECONDS = 10 * 60;

export type HoursAction = "none" | "warn" | "end";

export function hoursAction(remaining: number, hasBeenWarned: boolean): HoursAction {
  if (remaining <= 0) return "end";
  if (remaining <= HOURS_WARNING_SECONDS && !hasBeenWarned) return "warn";
  return "none";
}
