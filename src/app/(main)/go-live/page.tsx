import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/cloudflare";
import { getProfileByUserId, getViewer } from "@/modules/accounts";
import { GoLivePage } from "@/modules/broadcasting/components/GoLivePage";

export const metadata: Metadata = { title: "Go live" };

export default async function Page() {
  // Fresh: right after sign-up the session cookie may still say "listener".
  const viewer = await getViewer({ fresh: true });
  if (!viewer) redirect("/login?next=/go-live");
  if (viewer.role === "listener") redirect("/account");
  if (!(await getProfileByUserId(getDb(), viewer.id))) redirect("/profile/edit");
  return <GoLivePage />;
}
