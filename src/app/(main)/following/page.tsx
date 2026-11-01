import { HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/atoms/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";
import { getDb } from "@/lib/cloudflare";
import { getViewer } from "@/modules/accounts";
import { listFollowing } from "@/modules/social";
import { FollowingList } from "@/modules/social/components/FollowingList";
import { NotificationSettings } from "@/modules/social/components/NotificationSettings";

export const metadata: Metadata = { title: "Following" };
export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/following");
  const following = await listFollowing(getDb(), viewer);
  return (
    <div className="flex flex-col gap-4" data-testid="following-page">
      <h1 className="text-2xl font-semibold">Following</h1>
      {following.length ? <NotificationSettings /> : null}
      {following.length ? (
        <FollowingList initial={following} />
      ) : (
        <Empty data-testid="following-empty-state">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>You&apos;re not following anyone yet</EmptyTitle>
            <EmptyDescription>Follow preachers to hear when they go live.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/search">Find a preacher</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
