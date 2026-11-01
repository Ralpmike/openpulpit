"use client";

import { BanIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/atoms/button";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { formatRelative } from "@/helpers/format/date";
import { useListMyFollowersQuery, useSetBlockedMutation, type FollowerSummary } from "@/modules/social/store/endpoints";

function PersonRow({ person, action }: { person: FollowerSummary; action: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2" data-testid="follower-row">
      <PreacherAvatar name={person.name} photoUrl={person.image} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{person.name}</span>
        <span className="text-xs text-muted-foreground">{formatRelative(person.followedAt)}</span>
      </span>
      {action}
    </li>
  );
}

/** A preacher's followers, with Block (requirement 27). */
export function FollowersPage() {
  const { data, isLoading: isFollowersLoading } = useListMyFollowersQuery();
  const [setBlocked, { isLoading: isSetBlockedPending }] = useSetBlockedMutation();

  async function update(person: FollowerSummary, isBlocked: boolean) {
    try {
      await setBlocked({ listenerId: person.id, isBlocked }).unwrap();
      toast.success(isBlocked ? `${person.name} is blocked` : `${person.name} is unblocked`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isFollowersLoading) return <SectionLoadingSkeleton rows={4} label="Loading your followers" />;
  return (
    <div className="flex flex-col gap-6" data-testid="followers-page">
      <section className="flex flex-col gap-2" aria-labelledby="followers-heading">
        <h1 id="followers-heading" className="text-2xl font-semibold tabular-nums">
          {data?.followers.length ?? 0} {data?.followers.length === 1 ? "follower" : "followers"}
        </h1>
        {data?.followers.length ? (
          <ul className="flex flex-col divide-y">
            {data.followers.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                action={
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label={`Block ${person.name}`}>
                        <BanIcon data-icon="inline-start" aria-hidden />
                        Block
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Block {person.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They stop following you, can&apos;t follow you again and won&apos;t get your go-live notifications. Your broadcasts stay public, so they can still listen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={isSetBlockedPending} onClick={() => update(person, true)} data-testid="confirm-block">
                          Block
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No followers yet. Share your profile link to grow your audience.</p>
        )}
      </section>
      {data?.blocked.length ? (
        <section className="flex flex-col gap-2" aria-labelledby="blocked-heading">
          <h2 id="blocked-heading" className="text-lg font-semibold">Blocked</h2>
          <ul className="flex flex-col divide-y">
            {data.blocked.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                action={
                  <Button variant="outline" size="sm" disabled={isSetBlockedPending} onClick={() => update(person, false)}>
                    Unblock
                  </Button>
                }
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
