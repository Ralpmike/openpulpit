"use client";

import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { PreacherCard } from "@/components/ui/molecules/PreacherCard";
import type { FollowedPreacher } from "@/modules/social/models";
import { PreacherNotificationToggle } from "@/modules/social/components/PreacherNotificationToggle";
import { useListFollowingQuery } from "@/modules/social/store/endpoints";

export function FollowingList({ initial }: { initial: FollowedPreacher[] }) {
  const { data } = useListFollowingQuery();
  const following = data ?? initial;
  return (
    <ul className="flex flex-col" data-testid="following-list">
      {following.map((preacher) => (
        <li key={preacher.slug} className="flex items-center gap-2">
          <PreacherCard {...preacher} className="min-w-0 flex-1" />
          {preacher.isLive ? <LiveBadge /> : null}
          <PreacherNotificationToggle slug={preacher.slug} preacherName={preacher.name} isEnabled={preacher.notificationsEnabled} />
        </li>
      ))}
    </ul>
  );
}
