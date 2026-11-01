import { BookOpenIcon, CalendarIcon, ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Badge } from "@/components/ui/atoms/badge";
import { DataUseNote } from "@/components/ui/molecules/DataUseNote";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { recordingDataLabel } from "@/helpers/audio/dataUse";
import { formatShortDate } from "@/helpers/format/date";
import { formatDuration } from "@/helpers/format/duration";
import { getDb } from "@/lib/cloudflare";
import { getViewer } from "@/modules/accounts";
import { getPlayableRecording } from "@/modules/library/server/playback";
import { ListenButton } from "@/modules/player/ListenButton";
import { ReplayControlsFor } from "@/modules/player/ReplayControls";

export const dynamic = "force-dynamic";

const load = cache(async (id: string) => getPlayableRecording(getDb(), id, await getViewer()));

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const recording = await load((await params).id);
  if (!recording) return { title: "Sermon not found" };
  return { title: `${recording.title} · ${recording.preacher.name}` };
}

export default async function RecordingPage({ params }: PageProps<"/r/[id]">) {
  const recording = await load((await params).id);
  if (!recording) notFound();
  return (
    <article className="flex flex-col items-center gap-5 pt-4 text-center" data-testid="recording-page">
      <PreacherAvatar name={recording.preacher.name} photoUrl={recording.preacher.photoUrl} size="lg" />
      {!recording.isPublic ? <Badge variant="secondary">Hidden from listeners</Badge> : null}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{recording.title}</h1>
        <Link href={`/p/${recording.preacher.slug}`} className="text-muted-foreground underline-offset-4 hover:underline">
          {recording.preacher.name}
        </Link>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {recording.biblePassage ? (
            <span className="flex items-center gap-1">
              <BookOpenIcon aria-hidden className="size-4" />
              {recording.biblePassage}
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <CalendarIcon aria-hidden className="size-4" />
            {formatShortDate(recording.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon aria-hidden className="size-4" />
            {formatDuration(recording.durationSeconds)}
          </span>
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <ListenButton
          item={{
            kind: "replay",
            id: recording.id,
            title: recording.title,
            preacherName: recording.preacher.name,
            preacherSlug: recording.preacher.slug,
            artworkUrl: recording.preacher.photoUrl ?? undefined,
          }}
        />
        <DataUseNote label={`${recordingDataLabel(recording.durationSeconds, recording.bitrateKbps)} for the whole sermon`} />
        <ReplayControlsFor recordingId={recording.id} />
      </div>
      {recording.description ? <p className="text-left text-pretty whitespace-pre-line">{recording.description}</p> : null}
    </article>
  );
}
