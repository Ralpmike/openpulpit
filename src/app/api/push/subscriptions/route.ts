import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/modules/social/schemas/push";
import { deleteSubscription, saveSubscription } from "@/modules/social/server/notifications";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  const viewer = await requireSession();
  await saveSubscription(getDb(), viewer.id, await parseJson(request, pushSubscriptionSchema));
  return ok({ isSubscribed: true }, { status: 201 });
});

export const DELETE = route(async (request: Request) => {
  const viewer = await requireSession();
  const { endpoint } = await parseJson(request, pushUnsubscribeSchema);
  await deleteSubscription(getDb(), viewer.id, endpoint);
  return ok({ isSubscribed: false });
});
