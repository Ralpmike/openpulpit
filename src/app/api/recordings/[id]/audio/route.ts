import { notFound, route } from "@/lib/api";
import { getDb, getRecordingsBucket } from "@/lib/cloudflare";
import { getViewer } from "@/modules/accounts";
import { getPlayableRecording, streamRecording } from "@/modules/library/server/playback";

export const dynamic = "force-dynamic";

/** Public for public recordings; visibility is checked before any byte is read. */
export const GET = route(async (request: Request, { params }: RouteContext<"/api/recordings/[id]/audio">) => {
  const viewer = await getViewer();
  const recording = await getPlayableRecording(getDb(), (await params).id, viewer);
  if (!recording) throw notFound("We couldn't find that recording.");
  return streamRecording(getRecordingsBucket(), recording.r2Key, request.headers.get("range"));
});
