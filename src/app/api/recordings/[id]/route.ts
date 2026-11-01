import { ok, parseJson, route } from "@/lib/api";
import { getDb, getRecordingsBucket } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { recordingDetailsSchema } from "@/modules/library/schemas/recording";
import { deleteMyRecording, updateMyRecording } from "@/modules/library/server/manage";

export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/recordings/[id]">;

export const PATCH = route(async (request: Request, { params }: Context) => {
  const viewer = await requireRole("preacher");
  const details = await parseJson(request, recordingDetailsSchema);
  await updateMyRecording(getDb(), viewer, (await params).id, details);
  return ok({ id: (await params).id });
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireRole("preacher", { fresh: true });
  await deleteMyRecording(getDb(), getRecordingsBucket(), viewer, (await params).id);
  return ok({ id: (await params).id });
});
