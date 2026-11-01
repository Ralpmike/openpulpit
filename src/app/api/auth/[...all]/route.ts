import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Better Auth's own endpoints (sign-up, sign-in, email codes, Google, sessions). Public by design.
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
