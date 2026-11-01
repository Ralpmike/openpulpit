import { z } from "zod";

import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { acceptTerms } from "@/modules/accounts/server/terms";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  const viewer = await requireSession({ fresh: true });
  const { version } = await parseJson(request, z.object({ version: z.string().max(20) }));
  await acceptTerms(getDb(), viewer, version);
  return ok({ version });
});
