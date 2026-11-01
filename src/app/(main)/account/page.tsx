import { HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/atoms/button";
import { getViewer } from "@/modules/accounts";
import { BecomePreacherCard } from "@/modules/accounts/components/BecomePreacherCard";
import { ListenerProfileCard } from "@/modules/accounts/components/ListenerProfileCard";
import { SignOutButton } from "@/modules/accounts/components/SignOutButton";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");
  const isListener = viewer.role === "listener";
  return (
    <div className="flex flex-col gap-6" data-testid="account-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Your account</h1>
        <p className="text-muted-foreground">{viewer.email}</p>
      </div>
      {isListener ? (
        <ListenerProfileCard initialName={viewer.name} initialPhotoUrl={viewer.image} />
      ) : (
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" data-testid="edit-profile-link">
            <Link href="/profile/edit">Your preacher profile</Link>
          </Button>
          <Button asChild variant="outline" data-testid="my-recordings-link">
            <Link href="/profile/recordings">Your sermons</Link>
          </Button>
        </div>
      )}
      <Button asChild variant="outline" data-testid="following-link">
        <Link href="/following">
          <HeartIcon data-icon="inline-start" aria-hidden />
          Preachers you follow
        </Link>
      </Button>
      {isListener ? <BecomePreacherCard /> : null}
      <SignOutButton />
    </div>
  );
}
