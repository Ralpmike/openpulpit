import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/modules/accounts";
import { FollowersPage } from "@/modules/social/components/FollowersPage";

export const metadata: Metadata = { title: "Your followers" };

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile/followers");
  if (viewer.role === "listener") redirect("/account");
  return <FollowersPage />;
}
