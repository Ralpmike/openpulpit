import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { reportSchema } from "@/modules/moderation/schemas/report";
import { createReport } from "@/modules/moderation/server/reports";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  const viewer = await requireSession();
  const input = await parseJson(request, reportSchema);
  return ok(await createReport(getDb(), viewer, input), { status: 201 });
});
