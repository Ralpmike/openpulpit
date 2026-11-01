import "server-only";

import { ApiError } from "@/lib/api";
import { nowIso } from "@/lib/ids";
import type { Viewer } from "@/modules/accounts/server/session";
import { CURRENT_TERMS_VERSION } from "@/modules/accounts/terms";

/** Records that this person accepted the current terms and guidelines (requirement 24). */
export async function acceptTerms(db: D1Database, viewer: Viewer, version: string): Promise<void> {
  if (version !== CURRENT_TERMS_VERSION) throw new ApiError(409, "The terms have changed. Refresh the page to read the latest.");
  await db.prepare(`UPDATE "user" SET termsVersion = ?, updatedAt = ? WHERE id = ?`).bind(version, nowIso(), viewer.id).run();
}

/** Going live, following and reporting need the current terms accepted. */
export function requireAcceptedTerms(viewer: Viewer): void {
  if (viewer.termsVersion !== CURRENT_TERMS_VERSION) {
    throw new ApiError(403, "Please accept the terms of use and community guidelines first.");
  }
}
