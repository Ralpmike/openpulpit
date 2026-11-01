import { badRequest, ok, route } from "@/lib/api";
import { getDb, getRecordingsBucket } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { saveMyPhoto } from "@/modules/accounts/server/profiles";

export const dynamic = "force-dynamic";

/** Upload the preacher's photo (already resized in the browser). */
export const POST = route(async (request: Request) => {
  const viewer = await requireRole("preacher", { fresh: true });
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) throw badRequest("Choose a photo to upload.");
  return ok(await saveMyPhoto(getDb(), getRecordingsBucket(), viewer, file));
});
