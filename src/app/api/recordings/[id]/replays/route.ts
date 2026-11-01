import { z } from "zod";

import { notFound, ok, parseJson, route, tooManyRequests } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { consumeRateLimit, hashRateLimitKey } from "@/lib/rateLimit";
import { lagosDay } from "@/helpers/time/lagos";
import { getViewer } from "@/modules/accounts";
import { countReplay, getPlayableRecording } from "@/modules/library/server/playback";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ deviceId: z.string().regex(/^[A-Za-z0-9-]{16,64}$/) });

/** Called by the player after 30 s of playback. Public; rate-limited per network. */
export const POST = route(async (request: Request, { params }: RouteContext<"/api/recordings/[id]/replays">) => {
  const env = getEnv();
  const { id } = await params;
  const viewer = await getViewer();
  const salt = env.RATE_LIMIT_SALT || env.BETTER_AUTH_SECRET;
  const limit = await consumeRateLimit(env.DB, `replay:${request.headers.get("cf-connecting-ip") ?? "unknown"}`, { window: 3600, max: 120 }, { salt });
  if (!limit.allowed) throw tooManyRequests();
  const recording = await getPlayableRecording(env.DB, id, viewer);
  if (!recording) throw notFound();
  const { deviceId } = await parseJson(request, bodySchema);
  // Never store the raw device id; a signed-in person counts once whatever device they use.
  const listenerKey = viewer ? `u:${viewer.id}` : `d:${await hashRateLimitKey(deviceId, salt)}`;
  return ok({ isCounted: await countReplay(env.DB, { recordingId: id, listenerKey, day: lagosDay() }) });
});
