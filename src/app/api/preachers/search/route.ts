import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { searchPreachers } from "@/modules/accounts";

export const dynamic = "force-dynamic";

export const GET = route(async (request: Request) => {
  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100);
  return ok(await searchPreachers(getDb(), query));
});
