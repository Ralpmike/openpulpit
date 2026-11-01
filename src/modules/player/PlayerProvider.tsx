"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { setMediaPlaybackState, setMediaSession } from "@/modules/player/mediaSession";
import { useLiveAudio, type LiveAudioState } from "@/modules/player/useLiveAudio";
import { pause, resume, stop } from "@/store/playerSlice";

interface PlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  liveState: LiveAudioState;
  liveErrorMessage: string | null;
  unblockAudio: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside PlayerProvider");
  return value;
}

/**
 * The one persistent player (component-builder: the player). It lives in the
 * layout, so audio keeps playing while the listener browses. The `player`
 * slice says what to play; the audio element and LiveKit room live here.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { nowPlaying, isPlaying } = useAppSelector((state) => state.player);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveId = nowPlaying?.kind === "live" ? nowPlaying.id : null;
  const live = useLiveAudio(liveId, isPlaying, audioRef);

  useEffect(() => {
    setMediaSession(nowPlaying, {
      onPlay: () => dispatch(resume()),
      onPause: () => dispatch(pause()),
      onStop: () => dispatch(stop()),
    });
  }, [nowPlaying, dispatch]);

  useEffect(() => {
    setMediaPlaybackState(!nowPlaying ? "none" : isPlaying ? "playing" : "paused");
  }, [nowPlaying, isPlaying]);

  const value = useMemo(
    () => ({ audioRef, liveState: live.state, liveErrorMessage: live.errorMessage, unblockAudio: live.unblock }),
    [live.state, live.errorMessage, live.unblock],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* playsInline keeps iOS from going full screen; the element is hidden, controls are in the bar. */}
      <audio ref={audioRef} playsInline hidden data-testid="player-audio" />
    </PlayerContext.Provider>
  );
}
