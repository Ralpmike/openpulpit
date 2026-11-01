import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { applicationDecisionSchema } from "@/modules/accounts/schemas/auth";
import { decideVerification } from "@/modules/accounts/server/verification";

export const dynamic = "force-dynamic";

/** Approve or reject a verified-badge request. Logged in the audit log. */
export const POST = route(async (request: Request, { params }: RouteContext<"/api/admin/verification-requests/[id]">) => {
  const admin = await requireRole("admin", { fresh: true });
  const { id } = await params;
  const input = await parseJson(request, applicationDecisionSchema);
  await decideVerification(getDb(), admin, { id, ...input });
  return ok({ id });
});
