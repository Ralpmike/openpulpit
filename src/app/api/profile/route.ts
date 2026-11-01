import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { preacherProfileSchema } from "@/modules/accounts/schemas/profile";
import { getMyProfile, saveMyProfile } from "@/modules/accounts/server/profiles";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  return ok(await getMyProfile(getDb(), viewer));
});

export const PUT = route(async (request: Request) => {
  const viewer = await requireRole("preacher", { fresh: true });
  const input = await parseJson(request, preacherProfileSchema);
  return ok(await saveMyProfile(getDb(), viewer, input));
});
