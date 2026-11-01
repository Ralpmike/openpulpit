import { ok, route } from "@/lib/api";
import { getDb, getRecordingsBucket } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { saveMyAccountPhoto } from "@/modules/accounts/server/account";

export const dynamic = "force-dynamic";

/** Upload (multipart `photo`) or remove (DELETE) the account photo. */
export const POST = route(async (request: Request) => {
  const viewer = await requireSession({ fresh: true });
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  return ok(await saveMyAccountPhoto(getDb(), getRecordingsBucket(), viewer, file instanceof File ? file : null));
});

export const DELETE = route(async () => {
  const viewer = await requireSession({ fresh: true });
  return ok(await saveMyAccountPhoto(getDb(), getRecordingsBucket(), viewer, null));
});
