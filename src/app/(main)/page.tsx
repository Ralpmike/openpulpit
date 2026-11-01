import Link from "next/link";

import { Button } from "@/components/ui/atoms/button";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { PreacherCard } from "@/components/ui/molecules/PreacherCard";
import { getDb } from "@/lib/cloudflare";
import { getViewer, listSuggestedPreachers } from "@/modules/accounts";
import { listLiveNow } from "@/modules/broadcasting";
import { LiveNowSection } from "@/modules/broadcasting/components/LiveNowSection";
import { listRecentRecordings } from "@/modules/library";
import { RecordingCard } from "@/modules/library/components/RecordingCard";

export const dynamic = "force-dynamic";

/** Live now, then recent broadcasts, then suggested preachers (requirement 11). */
export default async function HomePage() {
  const db = getDb();
  const viewer = await getViewer();
  const [liveNow, recent, suggested] = await Promise.all([
    listLiveNow(db),
    listRecentRecordings(db, { limit: 10 }),
    listSuggestedPreachers(db, { viewerId: viewer?.id, limit: 6 }),
  ]);
  return (
    <div className="flex flex-col gap-8" data-testid="home-page">
      <h1 className="sr-only">OpenPulpit</h1>
      <InstallPrompt />
      <LiveNowSection initialBroadcasts={liveNow} />

      <section aria-labelledby="recent-heading" className="flex flex-col gap-2">
        <h2 id="recent-heading" className="text-lg font-semibold">
          Recent sermons
        </h2>
        {recent.length ? (
          <ul className="flex flex-col">
            {recent.map((recording) => (
              <li key={recording.id}>
                <RecordingCard recording={recording} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="recent-empty-state">
            Sermons appear here when broadcasts end.
          </p>
        )}
      </section>

      {suggested.length ? (
        <section aria-labelledby="suggested-heading" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 id="suggested-heading" className="text-lg font-semibold">
              Preachers to follow
            </h2>
            <Button variant="link" asChild className="px-0">
              <Link href="/search">Search</Link>
            </Button>
          </div>
          <ul className="flex flex-col">
            {suggested.map((preacher) => (
              <li key={preacher.slug}>
                <PreacherCard {...preacher} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
