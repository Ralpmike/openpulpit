"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import type { FollowState } from "@/modules/social/models";
import { PreacherNotificationToggle } from "@/modules/social/components/PreacherNotificationToggle";
import { useGetFollowStateQuery, useSetFollowingMutation } from "@/modules/social/store/endpoints";

export interface FollowButtonProps {
  slug: string;
  preacherName: string;
  initialState: FollowState;
  isSignedIn: boolean;
}

/** Follow / Following toggle (requirement 16). Visitors are sent to sign in first. */
export function FollowButton({ slug, preacherName, initialState, isSignedIn }: FollowButtonProps) {
  const { data } = useGetFollowStateQuery(slug, { skip: !isSignedIn });
  const [setFollowing, { isLoading: isSetFollowingPending }] = useSetFollowingMutation();
  const state = data ?? initialState;
  if (state.isSelf) return null;

  const followers = (
    <span className="text-sm text-muted-foreground tabular-nums" data-testid="follower-count">
      {state.followerCount} {state.followerCount === 1 ? "follower" : "followers"}
    </span>
  );

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button asChild size="lg" data-testid="follow-button">
          <Link href={`/login?next=${encodeURIComponent(`/p/${slug}`)}`}>
            <PlusIcon data-icon="inline-start" aria-hidden />
            Follow
          </Link>
        </Button>
        {followers}
      </div>
    );
  }

  async function toggle() {
    try {
      await setFollowing({ slug, isFollowing: !state.isFollowing }).unwrap();
      toast.success(state.isFollowing ? `Unfollowed ${preacherName}` : `Following ${preacherName}. We'll tell you when they go live.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
      <Button
        size="lg"
        variant={state.isFollowing ? "outline" : "default"}
        aria-pressed={state.isFollowing}
        disabled={isSetFollowingPending}
        onClick={toggle}
        data-testid="follow-button"
      >
        {state.isFollowing ? <CheckIcon data-icon="inline-start" aria-hidden /> : <PlusIcon data-icon="inline-start" aria-hidden />}
        {state.isFollowing ? "Following" : "Follow"}
      </Button>
      {state.isFollowing ? (
        <PreacherNotificationToggle slug={slug} preacherName={preacherName} isEnabled={state.notificationsEnabled} />
      ) : null}
      </div>
      {followers}
    </div>
  );
}
