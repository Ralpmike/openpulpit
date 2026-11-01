import { ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

/** The VAPID public key browsers subscribe with (public by design). */
export const GET = route(async () => ok({ publicKey: getEnv().VAPID_PUBLIC_KEY || null }));
