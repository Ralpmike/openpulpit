import { getDb, getEnv } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

/** Public liveness check: confirms the Worker runs and D1 answers. Returns no data. */
export async function GET() {
  const env = getEnv();
  let database: "ok" | "error" = "ok";
  try {
    await getDb().prepare("SELECT 1").first();
  } catch {
    database = "error";
  }
  return Response.json(
    { data: { status: database === "ok" ? "ok" : "degraded", env: env.APP_ENV, database } },
    { status: database === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
