import "server-only";

import { conflict, forbidden, notFound } from "@/lib/api";
import { newId } from "@/lib/ids";
import { auditStatement } from "@/modules/admin";
import type { Viewer } from "@/modules/accounts/server/session";
import { canChooseRoleNow, preacherApplicationRefusal } from "@/modules/accounts/server/policy";
import {
  decideApplicationStatement,
  getAccount,
  getApplication,
  insertApplication,
  latestApplication,
  setRoleStatement,
} from "@/modules/accounts/server/repo";

export interface RoleOptions {
  canChooseRole: boolean;
  application: { id: string; status: "pending" | "approved" | "rejected"; createdAt: string } | null;
}

export async function getRoleOptions(db: D1Database, viewer: Viewer): Promise<RoleOptions> {
  const [account, application] = await Promise.all([getAccount(db, viewer.id), latestApplication(db, viewer.id)]);
  if (!account) throw notFound();
  return {
    canChooseRole: canChooseRoleNow({ ...account, hasPreacherProfile: Boolean(account.hasPreacherProfile) }),
    application: application ? { id: application.id, status: application.status, createdAt: application.created_at } : null,
  };
}

/** A new account (first 24 hours) that signed up with a code or Google picks "preacher". */
export async function chooseToPreach(db: D1Database, viewer: Viewer): Promise<void> {
  const account = await getAccount(db, viewer.id);
  if (!account) throw notFound();
  if (!canChooseRoleNow({ ...account, hasPreacherProfile: Boolean(account.hasPreacherProfile) })) {
    throw forbidden("Apply to become a preacher instead; an admin will review it.");
  }
  const result = await setRoleStatement(db, viewer.id, "listener", "preacher").run();
  if (!result.meta.changes) throw conflict("Your role has already changed. Refresh the page.");
}

export async function applyToPreach(
  db: D1Database,
  viewer: Viewer,
  input: { ministry: string; note: string },
): Promise<{ id: string }> {
  const account = await getAccount(db, viewer.id);
  if (!account) throw notFound();
  const pending = await latestApplication(db, viewer.id);
  const refusal = preacherApplicationRefusal({ role: account.role, hasPendingApplication: pending?.status === "pending" });
  if (refusal === "not_listener") throw conflict("Your account can already go live.");
  if (refusal === "already_pending") throw conflict("Your application is waiting for review.");
  const id = newId();
  await insertApplication(db, { id, userId: viewer.id, ...input });
  return { id };
}

export async function decideApplication(
  db: D1Database,
  admin: Viewer,
  input: { id: string; decision: "approve" | "reject"; reason: string },
): Promise<void> {
  const application = await getApplication(db, input.id);
  if (!application) throw notFound();
  if (application.status !== "pending") throw conflict("This application has already been decided.");
  const status = input.decision === "approve" ? "approved" : "rejected";
  const statements = [
    decideApplicationStatement(db, { id: input.id, status, adminId: admin.id }),
    auditStatement(db, {
      actorId: admin.id,
      action: `preacher_application.${status}`,
      targetType: "user",
      targetId: application.user_id,
      reason: input.reason,
      metadata: { applicationId: input.id },
    }),
  ];
  if (status === "approved") statements.push(setRoleStatement(db, application.user_id, "listener", "preacher"));
  await db.batch(statements);
}
