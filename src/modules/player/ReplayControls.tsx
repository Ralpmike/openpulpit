"use client";

import { RotateCcwIcon, RotateCwIcon } from "lucide-react";

import { Button } from "@/components/ui/atoms/button";
import { Slider } from "@/components/ui/atoms/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/atoms/toggle-group";
import { formatClock, spokenDuration } from "@/helpers/format/duration";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { usePlayer } from "@/modules/player/PlayerProvider";
import { setSpeed, type PlaybackSpeed } from "@/store/playerSlice";

const SPEEDS: PlaybackSpeed[] = [1, 1.5, 2];

/** Seek, skip and speed for the recording that is playing (requirement 21). */
export function ReplayControls() {
  const dispatch = useAppDispatch();
  const speed = useAppSelector((state) => state.player.speed);
  const { replay } = usePlayer();
  const duration = Math.max(replay.duration, 0);
  return (
    <div className="flex w-full flex-col gap-4" data-testid="replay-controls">
      <div className="flex flex-col gap-2">
        <Slider
          value={[Math.min(replay.currentTime, duration || replay.currentTime)]}
          max={duration || 1}
          step={15}
          disabled={!duration}
          onValueChange={([value]) => replay.seek(value ?? 0)}
          aria-label="Position in the sermon"
          aria-valuetext={`${spokenDuration(replay.currentTime)} of ${spokenDuration(duration)}`}
          data-testid="replay-seek"
        />
        <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
          <span>{formatClock(replay.currentTime)}</span>
          <span>{duration ? `-${formatClock(duration - replay.currentTime)}` : "--:--"}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-lg" onClick={() => replay.seek(replay.currentTime - 15)} aria-label="Back 15 seconds">
          <RotateCcwIcon aria-hidden />
        </Button>
        <ToggleGroup
          type="single"
          value={String(speed)}
          onValueChange={(value) => value && dispatch(setSpeed(Number(value) as PlaybackSpeed))}
          aria-label="Playback speed"
          variant="outline"
        >
          {SPEEDS.map((value) => (
            <ToggleGroupItem key={value} value={String(value)} aria-label={`${value} times speed`} className="min-w-12 tabular-nums">
              {value}x
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" size="icon-lg" onClick={() => replay.seek(replay.currentTime + 30)} aria-label="Forward 30 seconds">
          <RotateCwIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** Shows the controls only while this recording is the one in the player. */
export function ReplayControlsFor({ recordingId }: { recordingId: string }) {
  const isCurrent = useAppSelector((state) => state.player.nowPlaying?.kind === "replay" && state.player.nowPlaying.id === recordingId);
  return isCurrent ? <ReplayControls /> : null;
}
