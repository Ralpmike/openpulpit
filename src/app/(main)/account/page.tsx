import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/atoms/button";
import { getViewer } from "@/modules/accounts";
import { BecomePreacherCard } from "@/modules/accounts/components/BecomePreacherCard";
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
      {viewer.role === "listener" ? (
        <BecomePreacherCard />
      ) : (
        <Button asChild variant="outline" data-testid="edit-profile-link">
          <Link href="/profile/edit">Your preacher profile</Link>
        </Button>
      )}
      <SignOutButton />
    </div>
  );
}
