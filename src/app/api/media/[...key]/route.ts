import { getRecordingsBucket } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

/** Public, cacheable images (avatars only). Recordings never go through this route. */
export async function GET(_request: Request, { params }: RouteContext<"/api/media/[...key]">) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!/^avatars\/[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(webp|jpg|png)$/.test(key)) {
    return new Response("Not found", { status: 404 });
  }
  const object = await getRecordingsBucket().get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      etag: object.httpEtag,
    },
  });
}
