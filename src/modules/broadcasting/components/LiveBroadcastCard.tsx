import { HeadphonesIcon } from "lucide-react";
import Link from "next/link";

import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import type { PublicBroadcast } from "@/modules/broadcasting/models";

export function LiveBroadcastCard({ broadcast }: { broadcast: PublicBroadcast }) {
  return (
    <Link
      href={`/live/${broadcast.id}`}
      data-testid="live-broadcast-card"
      className="flex items-center gap-3 rounded-lg border border-live/30 bg-live/5 p-3 transition-colors hover:bg-live/10 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <PreacherAvatar name={broadcast.preacher.name} photoUrl={broadcast.preacher.photoUrl} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <LiveBadge />
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <HeadphonesIcon aria-hidden className="size-3" />
            {broadcast.listenerCount} listening
          </span>
        </span>
        <span className="line-clamp-1 font-medium">{broadcast.title}</span>
        <span className="truncate text-sm text-muted-foreground">{broadcast.preacher.name}</span>
      </span>
    </Link>
  );
}
