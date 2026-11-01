import { notFound, route, tooManyRequests } from "@/lib/api";
import { getDb, getEnv, getRecordingsBucket, waitUntil } from "@/lib/cloudflare";
import { consumeRateLimit } from "@/lib/rateLimit";
import { addDailyStatsStatement } from "@/modules/admin";
import { getViewer } from "@/modules/accounts";
import { getPlayableRecording, streamRecording } from "@/modules/library/server/playback";

export const dynamic = "force-dynamic";

/** Public for public recordings; visibility is checked before any byte is read. */
export const GET = route(async (request: Request, { params }: RouteContext<"/api/recordings/[id]/audio">) => {
  // Public, so limited per network: seeking makes several Range requests, so the limit is generous.
  const env = getEnv();
  const network = request.headers.get("cf-connecting-ip") ?? "unknown";
  const limit = await consumeRateLimit(env.DB, `audio:${network}`, { window: 60, max: 240 }, { salt: env.RATE_LIMIT_SALT || env.BETTER_AUTH_SECRET });
  if (!limit.allowed) throw tooManyRequests();
  const viewer = await getViewer();
  const recording = await getPlayableRecording(getDb(), (await params).id, viewer);
  if (!recording) throw notFound("We couldn't find that recording.");
  // Replay bytes count towards the platform's bandwidth total (requirement 28).
  return streamRecording(getRecordingsBucket(), recording.r2Key, request.headers.get("range"), (bytes) =>
    waitUntil(addDailyStatsStatement(getDb(), { bandwidthBytes: bytes }).run().catch(() => undefined)),
  );
});
