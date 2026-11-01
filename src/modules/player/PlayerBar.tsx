"use client";

import { Loader2Icon, PauseIcon, PlayIcon, Volume2Icon, XIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/atoms/button";
import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { usePlayer } from "@/modules/player/PlayerProvider";
import { pause, resume, stop } from "@/store/playerSlice";

const LIVE_STATUS: Record<string, string> = {
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  ended: "This broadcast has ended",
  failed: "Lost the connection",
  blocked: "Tap to start audio",
};

/** Fixed above the bottom nav while something is playing. */
export function PlayerBar() {
  const dispatch = useAppDispatch();
  const { nowPlaying, isPlaying } = useAppSelector((state) => state.player);
  const { liveState, unblockAudio } = usePlayer();
  if (!nowPlaying) return null;

  const isLive = nowPlaying.kind === "live";
  const status = isLive && isPlaying ? LIVE_STATUS[liveState] : undefined;
  const isBusy = isLive && isPlaying && (liveState === "connecting" || liveState === "reconnecting");
  const href = isLive ? `/live/${nowPlaying.id}` : `/r/${nowPlaying.id}`;

  return (
    <section
      aria-label="Now playing"
      data-testid="player-bar"
      className="fixed inset-x-0 bottom-above-nav z-player border-t bg-card/95 shadow-lg supports-backdrop-filter:backdrop-blur-sm"
    >
      <div className="mx-auto flex h-player max-w-xl items-center gap-3 px-4">
        <PreacherAvatar name={nowPlaying.preacherName} photoUrl={nowPlaying.artworkUrl ?? null} size="sm" />
        <Link href={href} className="flex min-w-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-ring">
          <span className="flex items-center gap-2">
            {isLive ? <LiveBadge /> : null}
            <span className="truncate text-sm font-semibold">{nowPlaying.title}</span>
          </span>
          <span className="truncate text-xs text-muted-foreground" aria-live="polite">
            {status ?? nowPlaying.preacherName}
          </span>
        </Link>
        {liveState === "blocked" && isLive && isPlaying ? (
          <Button size="icon" onClick={unblockAudio} aria-label="Start audio" data-testid="player-unblock">
            <Volume2Icon aria-hidden />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={() => dispatch(isPlaying ? pause() : resume())}
            aria-label={isPlaying ? "Pause" : "Play"}
            data-testid="player-toggle"
          >
            {isBusy ? <Loader2Icon aria-hidden className="animate-spin" /> : isPlaying ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => dispatch(stop())} aria-label="Close player" data-testid="player-close">
          <XIcon aria-hidden />
        </Button>
      </div>
    </section>
  );
}
