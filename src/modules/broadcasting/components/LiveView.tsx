"use client";

import { ClockIcon, HeadphonesIcon, SquareIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/atoms/alert-dialog";
import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { formatClock, formatDuration, spokenDuration } from "@/helpers/format/duration";

export interface LiveViewProps {
  elapsedSeconds: number;
  listenerCount: number;
  isReconnecting: boolean;
  /** Set when 10 minutes or less of this month's hours are left. */
  remainingSeconds: number | null;
  isEnding: boolean;
  onEnd: () => void;
}

/** What the preacher sees while live (requirement 8). */
export function LiveView({ elapsedSeconds, listenerCount, isReconnecting, remainingSeconds, isEnding, onEnd }: LiveViewProps) {
  const listeners = `${listenerCount} ${listenerCount === 1 ? "person" : "people"}`;
  return (
    <div className="flex flex-col gap-6" data-testid="live-view">
      <div className="flex items-center gap-3">
        <LiveBadge />
        <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {isReconnecting ? "Reconnecting… you're still live for up to a minute." : "You're live"}
        </span>
      </div>

      {isReconnecting ? (
        <Alert data-testid="reconnecting-alert">
          <AlertTitle>Connection dropped</AlertTitle>
          <AlertDescription>We&apos;re reconnecting you. Keep talking; listeners will hear you again shortly.</AlertDescription>
        </Alert>
      ) : null}

      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon aria-hidden className="size-4" />
            Elapsed
          </dt>
          <dd className="text-3xl font-semibold tabular-nums" data-testid="elapsed-time" aria-label={spokenDuration(elapsedSeconds)}>
            {formatClock(elapsedSeconds)}
          </dd>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <HeadphonesIcon aria-hidden className="size-4" />
            Listening
          </dt>
          <dd className="text-3xl font-semibold tabular-nums" data-testid="listener-count">
            {listenerCount}
          </dd>
        </div>
      </dl>

      {remainingSeconds !== null ? (
        <Alert data-testid="hours-warning" role="status">
          <AlertTitle>{formatDuration(remainingSeconds)} of broadcast time left this month</AlertTitle>
          <AlertDescription>The broadcast ends automatically when it runs out, and the recording is kept.</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <LoaderButton variant="destructive" size="lg" isLoading={isEnding} loadingLabel="Ending…" data-testid="end-broadcast-button">
            <SquareIcon data-icon="inline-start" aria-hidden />
            End broadcast
          </LoaderButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End your broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              {listeners} {listenerCount === 1 ? "is" : "are"} listening. Your recording will be saved to your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep preaching</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onEnd} data-testid="confirm-end-broadcast">
              End broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
