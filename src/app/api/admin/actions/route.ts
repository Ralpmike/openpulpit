import { ok, parseJson, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { adminActionSchema } from "@/modules/admin/schemas/actions";
import { runAdminAction } from "@/modules/admin/server/moderation";
import { registerBroadcastingHooks } from "@/modules/broadcasting/hooks.server";

export const dynamic = "force-dynamic";

/** Every admin action goes through here: fresh admin check, change + audit row in one batch. */
export const POST = route(async (request: Request) => {
  const admin = await requireRole("admin", { fresh: true });
  const input = await parseJson(request, adminActionSchema);
  registerBroadcastingHooks();
  return ok(await runAdminAction(getEnv(), admin, input));
});
