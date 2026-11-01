"use client";

import { HourglassIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import { Progress } from "@/components/ui/atoms/progress";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { formatDayMonth } from "@/helpers/format/date";
import { formatDuration } from "@/helpers/format/duration";
import type { HoursSummary } from "@/modules/broadcasting/models";

export interface HoursRemainingProps {
  hours: HoursSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

const LOW_SECONDS = 60 * 60;

/** This month's broadcast hours, shown before going live (requirement 10). */
export function HoursRemaining({ hours, isLoading, isError }: HoursRemainingProps) {
  if (isLoading) return <SectionLoadingSkeleton rows={1} hasAvatar={false} label="Loading your broadcast hours" />;
  if (isError || !hours) return null; // The server still enforces the cap; don't block on a missing number.
  const renews = formatDayMonth(hours.renewsAt);
  if (hours.remainingSeconds <= 0) {
    return (
      <Alert variant="destructive" data-testid="hours-used-up">
        <HourglassIcon aria-hidden />
        <AlertTitle>No broadcast hours left this month</AlertTitle>
        <AlertDescription>Your free hours renew on {renews}.</AlertDescription>
      </Alert>
    );
  }
  const usedPercent = Math.round((hours.usedSeconds / hours.capSeconds) * 100);
  const isLow = hours.remainingSeconds <= LOW_SECONDS;
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4" data-testid="hours-remaining">
      <p className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <HourglassIcon aria-hidden className="size-4" />
          {formatDuration(hours.remainingSeconds)} left this month
        </span>
        <span className="text-muted-foreground tabular-nums">of {formatDuration(hours.capSeconds)}</span>
      </p>
      <Progress value={usedPercent} aria-label="Broadcast hours used this month" aria-valuetext={`${usedPercent}% used`} />
      <p className={isLow ? "text-sm text-status-warning" : "text-sm text-muted-foreground"}>
        {isLow ? "Running low. " : ""}Renews on {renews}. A broadcast ends automatically if the hours run out.
      </p>
    </div>
  );
}
