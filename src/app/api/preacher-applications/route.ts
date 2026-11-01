import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { preacherApplicationSchema } from "@/modules/accounts/schemas/auth";
import { applyToPreach } from "@/modules/accounts/server/service";

export const dynamic = "force-dynamic";

/** A listener applies to become a preacher; an admin reviews it. */
export const POST = route(async (request: Request) => {
  const viewer = await requireSession({ fresh: true });
  const input = await parseJson(request, preacherApplicationSchema);
  return ok(await applyToPreach(getDb(), viewer, input), { status: 201 });
});
