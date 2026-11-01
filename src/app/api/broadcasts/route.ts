import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireAcceptedTerms, requireRole } from "@/modules/accounts";
import { broadcastDetailsSchema } from "@/modules/broadcasting/schemas/broadcast";
import { createBroadcast } from "@/modules/broadcasting/server/service";

export const dynamic = "force-dynamic";

/** A preacher creates a broadcast (status `ready`) before going live. */
export const POST = route(async (request: Request) => {
  const viewer = await requireRole("preacher", { fresh: true });
  requireAcceptedTerms(viewer);
  const input = await parseJson(request, broadcastDetailsSchema);
  return ok(await createBroadcast(getDb(), viewer, input), { status: 201 });
});
