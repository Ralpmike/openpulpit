import { z } from "zod";

import { notFound, ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { getPlayableRecording, getPosition, savePosition } from "@/modules/library/server/playback";

export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/recordings/[id]/position">;
const positionSchema = z.object({ positionSeconds: z.number().min(0).max(24 * 3600) });

export const GET = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireSession();
  return ok({ positionSeconds: await getPosition(getDb(), viewer, (await params).id) });
});

export const PUT = route(async (request: Request, { params }: Context) => {
  const viewer = await requireSession();
  const { id } = await params;
  if (!(await getPlayableRecording(getDb(), id, viewer))) throw notFound();
  const { positionSeconds } = await parseJson(request, positionSchema);
  await savePosition(getDb(), viewer, id, positionSeconds);
  return ok({ positionSeconds });
});
