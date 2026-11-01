import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { recordingVisibilitySchema } from "@/modules/library/schemas/recording";
import { setMyRecordingHidden } from "@/modules/library/server/manage";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request, { params }: RouteContext<"/api/recordings/[id]/visibility">) => {
  const viewer = await requireRole("preacher");
  const { isHidden } = await parseJson(request, recordingVisibilitySchema);
  return ok({ visibility: await setMyRecordingHidden(getDb(), viewer, (await params).id, isHidden) });
});
