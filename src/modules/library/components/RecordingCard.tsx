import { BookOpenIcon, PlayIcon } from "lucide-react";
import Link from "next/link";

import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { formatRelative } from "@/helpers/format/date";
import { formatDuration } from "@/helpers/format/duration";
import type { PublicRecording } from "@/modules/library/models";

export interface RecordingCardProps {
  recording: PublicRecording;
  /** Hide the preacher on their own profile page. */
  showPreacher?: boolean;
}

export function RecordingCard({ recording, showPreacher = true }: RecordingCardProps) {
  return (
    <Link
      href={`/r/${recording.id}`}
      data-testid="recording-card"
      className="flex min-h-16 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
    >
      {showPreacher ? (
        <PreacherAvatar name={recording.preacher.name} photoUrl={recording.preacher.photoUrl} />
      ) : (
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <PlayIcon className="size-5" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 font-medium">{recording.title}</span>
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {[showPreacher ? recording.preacher.name : null, formatDuration(recording.durationSeconds), formatRelative(recording.createdAt)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {recording.biblePassage ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpenIcon aria-hidden className="size-3" />
            {recording.biblePassage}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
