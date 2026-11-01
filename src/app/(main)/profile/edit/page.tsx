import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/modules/accounts";
import { ProfileEditPage } from "@/modules/accounts/components/ProfileEditPage";

export const metadata: Metadata = { title: "Your preacher profile" };

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile/edit");
  if (viewer.role === "listener") redirect("/account");
  return <ProfileEditPage accountName={viewer.name} />;
}
