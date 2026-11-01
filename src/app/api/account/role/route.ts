import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { chooseRoleSchema } from "@/modules/accounts/schemas/auth";
import { chooseToPreach } from "@/modules/accounts/server/service";

export const dynamic = "force-dynamic";

/** A new account picks "preacher" (first 24 hours only; otherwise apply). */
export const POST = route(async (request: Request) => {
  const viewer = await requireSession({ fresh: true });
  await parseJson(request, chooseRoleSchema);
  await chooseToPreach(getDb(), viewer);
  return ok({ role: "preacher" });
});
