"use client";

import { MicIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { Button } from "@/components/ui/atoms/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { MyRecordingItem } from "@/modules/library/components/MyRecordingItem";
import { useListMyRecordingsQuery } from "@/modules/library/store/endpoints";

export function MyRecordingsPage() {
  const { data: recordings, isLoading: isRecordingsLoading, isError: isRecordingsError, refetch } = useListMyRecordingsQuery(undefined, {
    // While a recording is saving, check back every 30 s.
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
  });
  return (
    <div className="flex flex-col gap-4" data-testid="my-recordings-page">
      <h1 className="text-2xl font-semibold">Your sermons</h1>
      {isRecordingsLoading ? (
        <SectionLoadingSkeleton rows={4} hasAvatar={false} label="Loading your sermons" />
      ) : isRecordingsError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-start gap-2">
            Your sermons didn&apos;t load.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : recordings?.length ? (
        <ul className="flex flex-col">
          {recordings.map((recording) => (
            <MyRecordingItem key={recording.id} recording={recording} />
          ))}
        </ul>
      ) : (
        <Empty data-testid="my-recordings-empty-state">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MicIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No sermons yet</EmptyTitle>
            <EmptyDescription>Your broadcasts appear here when they end.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/go-live">Go live</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
