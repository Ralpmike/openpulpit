import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { verificationRequestSchema } from "@/modules/accounts/schemas/auth";
import { getVerificationState, requestVerification } from "@/modules/accounts/server/verification";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  return ok(await getVerificationState(getDb(), viewer));
});

export const POST = route(async (request: Request) => {
  const viewer = await requireRole("preacher", { fresh: true });
  const { message } = await parseJson(request, verificationRequestSchema);
  return ok(await requestVerification(getDb(), viewer, message), { status: 201 });
});
