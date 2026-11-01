import "server-only";
import { headers } from "next/headers";

import { forbidden, unauthorized } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import type { Me } from "@/modules/accounts/models";
import type { UserRole, UserStatus } from "@/modules/accounts/server/authSchema";

export interface Viewer {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  termsVersion: string;
}

interface SessionOptions {
  /**
   * Re-read the session and user from D1 instead of the 5-minute cookie cache.
   * Use for anything sensitive (minting a publish token, admin actions), so a
   * suspension or role change applies at once.
   */
  fresh?: boolean;
}

/** The signed-in person, or null. Never throws for signed-out visitors. */
export async function getViewer({ fresh = false }: SessionOptions = {}): Promise<Viewer | null> {
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: fresh ? { disableCookieCache: true } : undefined,
  });
  if (!session) return null;
  const user = session.user as typeof session.user & { role?: string; status?: string; termsVersion?: string };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: (user.role ?? "listener") as UserRole,
    status: (user.status ?? "active") as UserStatus,
    termsVersion: user.termsVersion ?? "",
  };
}

/** The signed-in person, or a 401. Suspended and banned accounts get a 403. */
export async function requireSession(options: SessionOptions = {}): Promise<Viewer> {
  const viewer = await getViewer(options);
  if (!viewer) throw unauthorized();
  if (viewer.status === "suspended" || viewer.status === "banned") {
    throw forbidden("This account can't do that while it is suspended or banned.");
  }
  return viewer;
}

/** The signed-in person with one of the given roles (admins pass every role check). */
export async function requireRole(roles: UserRole | UserRole[], options: SessionOptions = {}): Promise<Viewer> {
  const viewer = await requireSession(options);
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(viewer.role) && viewer.role !== "admin") {
    throw forbidden(
      allowed.includes("preacher") ? "Only preachers can do that." : "You don't have permission to do that.",
    );
  }
  return viewer;
}

export function toMe(viewer: Viewer, currentTermsVersion: string): Me {
  return {
    id: viewer.id,
    name: viewer.name,
    email: viewer.email,
    image: viewer.image,
    role: viewer.role,
    status: viewer.status,
    hasAcceptedTerms: viewer.termsVersion === currentTermsVersion,
  };
}
