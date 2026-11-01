"use client";

import { ArchiveIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import { useGetRecordingLimitQuery } from "@/modules/library/store/endpoints";

/** Before going live: which old sermon the next one will replace, at the free-tier limit. */
export function RecordingLimitNotice() {
  const { data: status } = useGetRecordingLimitQuery();
  if (!status?.nextToGo) return null;
  return (
    <Alert data-testid="recording-limit-notice">
      <ArchiveIcon aria-hidden />
      <AlertTitle>You keep your {status.limit} newest sermons</AlertTitle>
      <AlertDescription>
        When this broadcast is saved, &ldquo;{status.nextToGo.title}&rdquo; will be removed to make room.
      </AlertDescription>
    </Alert>
  );
}
