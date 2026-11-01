import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/modules/accounts";
import { SignOutButton } from "@/modules/accounts/components/SignOutButton";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");
  return (
    <div className="flex flex-col gap-6" data-testid="account-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{viewer.name || "Your account"}</h1>
        <p className="text-muted-foreground">{viewer.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
