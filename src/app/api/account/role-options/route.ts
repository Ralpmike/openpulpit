import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { getRoleOptions } from "@/modules/accounts/server/service";

export const dynamic = "force-dynamic";

/** Whether this account may still pick "preacher", and its latest application. */
export const GET = route(async () => {
  const viewer = await requireSession();
  return ok(await getRoleOptions(getDb(), viewer));
});
