import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { listAuditLog } from "@/modules/admin/server/queues";

export const dynamic = "force-dynamic";

export const GET = route(async (request: Request) => {
  await requireRole("admin", { fresh: true });
  const before = new URL(request.url).searchParams.get("before") ?? undefined;
  return ok(await listAuditLog(getDb(), { before }));
});
