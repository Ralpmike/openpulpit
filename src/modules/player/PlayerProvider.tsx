"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { setMediaPlaybackState, setMediaSession } from "@/modules/player/mediaSession";
import { useLiveAudio, type LiveAudioState } from "@/modules/player/useLiveAudio";
import { useReplayAudio, type UseReplayAudioReturn } from "@/modules/player/useReplayAudio";
import { pause, resume, setPrefersHighQuality, stop } from "@/store/playerSlice";

const QUALITY_KEY = "openpulpit.audioQuality";

interface PlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  liveState: LiveAudioState;
  liveErrorMessage: string | null;
  unblockAudio: () => void;
  replay: UseReplayAudioReturn;
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
  const { nowPlaying, isPlaying, prefersHighQuality, speed } = useAppSelector((state) => state.player);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveId = nowPlaying?.kind === "live" ? nowPlaying.id : null;
  const live = useLiveAudio(liveId, isPlaying, audioRef, prefersHighQuality);
  const onReplayEnded = useCallback(() => dispatch(pause()), [dispatch]);
  const replay = useReplayAudio(nowPlaying, isPlaying, speed, audioRef, onReplayEnded);
  const replaySeekRef = useRef<(delta: number) => void>(() => undefined);
  useEffect(() => {
    replaySeekRef.current = (delta) => replay.seek(replay.currentTime + delta);
  }, [replay]);

  // Remember "Higher quality on Wi-Fi" on this device (a per-viewer convenience, so localStorage).
  useEffect(() => {
    try {
      if (localStorage.getItem(QUALITY_KEY) === "high") dispatch(setPrefersHighQuality(true));
    } catch {
      // Private mode: fine, it just isn't remembered.
    }
  }, [dispatch]);
  useEffect(() => {
    try {
      localStorage.setItem(QUALITY_KEY, prefersHighQuality ? "high" : "standard");
    } catch {
      // ignore
    }
  }, [prefersHighQuality]);

  useEffect(() => {
    setMediaSession(nowPlaying, {
      onPlay: () => dispatch(resume()),
      onPause: () => dispatch(pause()),
      onStop: () => dispatch(stop()),
    });
    if (nowPlaying?.kind === "replay" && typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("seekbackward", () => replaySeekRef.current(-15));
        navigator.mediaSession.setActionHandler("seekforward", () => replaySeekRef.current(30));
      } catch {
        // unsupported
      }
    }
  }, [nowPlaying, dispatch]);

  useEffect(() => {
    setMediaPlaybackState(!nowPlaying ? "none" : isPlaying ? "playing" : "paused");
  }, [nowPlaying, isPlaying]);

  const value = useMemo(
    () => ({ audioRef, liveState: live.state, liveErrorMessage: live.errorMessage, unblockAudio: live.unblock, replay }),
    [live.state, live.errorMessage, live.unblock, replay],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* playsInline keeps iOS from going full screen; the element is hidden, controls are in the bar. */}
      <audio ref={audioRef} playsInline hidden data-testid="player-audio" />
    </PlayerContext.Provider>
  );
}
