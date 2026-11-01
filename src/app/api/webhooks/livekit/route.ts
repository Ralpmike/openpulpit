import { getEnv } from "@/lib/cloudflare";
import { liveKitConfig, webhookReceiver } from "@/lib/livekit";
import { registerBroadcastingHooks } from "@/modules/broadcasting/hooks.server";
import { handleLiveKitEvent } from "@/modules/broadcasting/server/webhooks";

export const dynamic = "force-dynamic";

/** Public, so the LiveKit signature is checked before anything else. */
export async function POST(request: Request) {
  const env = getEnv();
  const body = await request.text();
  let event;
  try {
    event = await webhookReceiver(liveKitConfig(env)).receive(body, request.headers.get("authorization") ?? undefined);
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
  registerBroadcastingHooks();
  try {
    await handleLiveKitEvent(env, event);
  } catch (error) {
    console.error("LiveKit webhook failed", event.event, error);
    return new Response("Error", { status: 500 }); // LiveKit retries; handlers are idempotent
  }
  return new Response("OK");
}
