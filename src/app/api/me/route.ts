import { ok, route } from "@/lib/api";
import { getViewer, toMe } from "@/modules/accounts";
import { CURRENT_TERMS_VERSION } from "@/modules/accounts/terms";

export const dynamic = "force-dynamic";

/** The signed-in person, or null for visitors (listening needs no account). */
export const GET = route(async () => {
  const viewer = await getViewer();
  return ok(viewer ? toMe(viewer, CURRENT_TERMS_VERSION) : null);
});
