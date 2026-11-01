import { BookOpenIcon, HeadphonesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Button } from "@/components/ui/atoms/button";
import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { DataUseNote } from "@/components/ui/molecules/DataUseNote";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { dataUseLabel } from "@/helpers/audio/dataUse";
import { getDb } from "@/lib/cloudflare";
import { getViewer } from "@/modules/accounts";
import { shareMetadata } from "@/lib/metadata";
import { ShareButtons } from "@/components/ui/molecules/ShareButtons";
import { ReportButton } from "@/modules/moderation/components/ReportButton";
import { getBroadcastWithPreacher } from "@/modules/broadcasting/server/queries";
import { getPublicRecordingIdForBroadcast } from "@/modules/library";
import { ListenButton } from "@/modules/player/ListenButton";
import { QualityToggle } from "@/modules/player/QualityToggle";

export const dynamic = "force-dynamic";

const load = cache((id: string) => getBroadcastWithPreacher(getDb(), id));

export async function generateMetadata({ params }: PageProps<"/live/[id]">): Promise<Metadata> {
  const broadcast = await load((await params).id);
  if (!broadcast) return { title: "Broadcast not found" };
  const title = `${broadcast.status === "live" ? "Live: " : ""}${broadcast.title}`;
  const description = `${broadcast.preacher.name} on OpenPulpit${broadcast.biblePassage ? ` · ${broadcast.biblePassage}` : ""}`;
  return shareMetadata({ title, description, path: `/live/${broadcast.id}`, image: broadcast.preacher.photoUrl });
}

export default async function LivePage({ params }: PageProps<"/live/[id]">) {
  const broadcast = await load((await params).id);
  if (!broadcast) notFound();
  const recordingId = broadcast.status === "ended" ? await getPublicRecordingIdForBroadcast(getDb(), broadcast.id) : null;
  return (
    <article className="flex flex-col items-center gap-5 pt-4 text-center" data-testid="live-page">
      <PreacherAvatar name={broadcast.preacher.name} photoUrl={broadcast.preacher.photoUrl} size="lg" />
      {broadcast.status === "live" ? <LiveBadge /> : null}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{broadcast.title}</h1>
        <Link href={`/p/${broadcast.preacher.slug}`} className="text-muted-foreground underline-offset-4 hover:underline">
          {broadcast.preacher.name}
        </Link>
        {broadcast.biblePassage ? (
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <BookOpenIcon aria-hidden className="size-4" />
            {broadcast.biblePassage}
          </p>
        ) : null}
      </div>
      <div className="flex justify-center">
        <ReportButton targetType="broadcast" targetId={broadcast.id} isSignedIn={Boolean(await getViewer())} returnPath={`/live/${broadcast.id}`} />
      </div>
      {broadcast.description ? <p className="text-pretty whitespace-pre-line">{broadcast.description}</p> : null}

      {broadcast.status === "live" ? (
        <div className="flex w-full flex-col gap-2">
          <ListenButton
            item={{
              kind: "live",
              id: broadcast.id,
              title: broadcast.title,
              preacherName: broadcast.preacher.name,
              preacherSlug: broadcast.preacher.slug,
              artworkUrl: broadcast.preacher.photoUrl ?? undefined,
            }}
          />
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground tabular-nums">
            <HeadphonesIcon aria-hidden className="size-4" />
            {broadcast.listenerCount} listening now
          </p>
          <DataUseNote label={`${dataUseLabel()} of data`} />
          <ShareButtons path={`/live/${broadcast.id}`} text={`${broadcast.preacher.name} is live: ${broadcast.title}`} />
          <div className="mt-2 rounded-lg border p-3 text-left">
            <QualityToggle />
          </div>
        </div>
      ) : broadcast.status === "ended" ? (
        <div className="flex flex-col items-center gap-3" data-testid="broadcast-ended">
          <p className="text-muted-foreground">This broadcast has ended.</p>
          {recordingId ? (
            <Button asChild size="lg">
              <Link href={`/r/${recordingId}`}>Play the recording</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">The recording will appear on the preacher&apos;s profile shortly.</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">This broadcast hasn&apos;t started yet.</p>
      )}
    </article>
  );
}
