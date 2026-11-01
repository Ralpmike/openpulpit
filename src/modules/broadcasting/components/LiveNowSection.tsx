"use client";

import { RadioIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/atoms/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";
import type { PublicBroadcast } from "@/modules/broadcasting/models";
import { LiveBroadcastCard } from "@/modules/broadcasting/components/LiveBroadcastCard";
import { useListLiveNowQuery } from "@/modules/broadcasting/store/endpoints";

export interface LiveNowSectionProps {
  /** Rendered on the server, so the list shows before any JavaScript runs. */
  initialBroadcasts: PublicBroadcast[];
}

/** Who is live now; refreshes every 30 seconds while the page is in view. */
export function LiveNowSection({ initialBroadcasts }: LiveNowSectionProps) {
  const { data } = useListLiveNowQuery(undefined, { pollingInterval: 30_000, skipPollingIfUnfocused: true });
  const broadcasts = data ?? initialBroadcasts;
  return (
    <section aria-labelledby="live-now-heading" className="flex flex-col gap-3" data-testid="live-now-section">
      <h2 id="live-now-heading" className="text-lg font-semibold">
        Live now
      </h2>
      {broadcasts.length ? (
        <ul className="flex flex-col gap-2">
          {broadcasts.map((broadcast) => (
            <li key={broadcast.id}>
              <LiveBroadcastCard broadcast={broadcast} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="border border-dashed p-6" data-testid="live-now-empty-state">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No one is live right now</EmptyTitle>
            <EmptyDescription>Follow preachers to hear the moment they go live.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link href="#recent-heading">Browse recent sermons</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
