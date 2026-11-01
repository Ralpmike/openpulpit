import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { listRecentRecordings } from "@/modules/library";

export const dynamic = "force-dynamic";

export const GET = route(async (request: Request) => {
  const before = new URL(request.url).searchParams.get("before") ?? undefined;
  return ok(await listRecentRecordings(getDb(), { limit: 20, before }));
});
