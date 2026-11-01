import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/modules/accounts";
import { MyRecordingsPage } from "@/modules/library/components/MyRecordingsPage";

export const metadata: Metadata = { title: "Your sermons" };

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile/recordings");
  if (viewer.role === "listener") redirect("/account");
  return <MyRecordingsPage />;
}
