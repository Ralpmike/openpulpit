import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { getViewer, listSuggestedPreachers } from "@/modules/accounts";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await getViewer();
  return ok(await listSuggestedPreachers(getDb(), { viewerId: viewer?.id }));
});
