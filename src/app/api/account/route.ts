import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { accountNameSchema } from "@/modules/accounts/schemas/auth";
import { updateMyName } from "@/modules/accounts/server/account";

export const dynamic = "force-dynamic";

export const PATCH = route(async (request: Request) => {
  const viewer = await requireSession();
  const { name } = await parseJson(request, accountNameSchema);
  await updateMyName(getDb(), viewer, name);
  return ok({ name });
});
