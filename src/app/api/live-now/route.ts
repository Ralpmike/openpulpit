import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { listLiveNow } from "@/modules/broadcasting";

export const dynamic = "force-dynamic";

export const GET = route(async () => ok(await listLiveNow(getDb())));
