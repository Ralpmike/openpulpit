import { z } from "zod";

export const ADMIN_ACTIONS = [
  "end_broadcast",
  "hide_recording",
  "unhide_recording",
  "warn_user",
  "suspend_user",
  "ban_user",
  "restore_user",
  "dismiss_reports",
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export const adminActionSchema = z.object({
  action: z.enum(ADMIN_ACTIONS),
  /** broadcast id, recording id, user id, or (for dismiss_reports) "<type>:<id>" of the reported target. */
  targetId: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(3, "Say briefly why. It goes in the audit log.").max(500),
});
export type AdminActionInput = z.infer<typeof adminActionSchema>;
