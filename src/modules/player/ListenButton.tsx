"use client";

import { HeadphonesIcon, PauseIcon } from "lucide-react";

import { Button } from "@/components/ui/atoms/button";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { pause, play, type NowPlaying } from "@/store/playerSlice";

export interface ListenButtonProps {
  item: NowPlaying;
  label?: string;
}

/** Starts this broadcast or recording in the persistent player. Playback only ever starts from a tap. */
export function ListenButton({ item, label }: ListenButtonProps) {
  const dispatch = useAppDispatch();
  const isThisPlaying = useAppSelector(
    (state) => state.player.isPlaying && state.player.nowPlaying?.id === item.id && state.player.nowPlaying.kind === item.kind,
  );
  return (
    <Button
      size="lg"
      className="h-14 text-lg"
      onClick={() => dispatch(isThisPlaying ? pause() : play(item))}
      data-testid="listen-button"
    >
      {isThisPlaying ? <PauseIcon data-icon="inline-start" aria-hidden /> : <HeadphonesIcon data-icon="inline-start" aria-hidden />}
      {isThisPlaying ? "Pause" : (label ?? (item.kind === "live" ? "Listen live" : "Play"))}
    </Button>
  );
}
