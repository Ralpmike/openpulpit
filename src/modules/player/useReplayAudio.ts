"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "@/helpers/api/baseQuery";
import type { NowPlaying, PlaybackSpeed } from "@/store/playerSlice";

export type UseReplayAudioReturn = {
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  hasEnded: boolean;
  seek: (seconds: number) => void;
};

const SAVE_EVERY_MS = 15_000;
const localKey = (id: string) => `openpulpit.position.${id}`;

function readLocal(id: string): number {
  try {
    return Number(localStorage.getItem(localKey(id))) || 0;
  } catch {
    return 0;
  }
}

function writeLocal(id: string, seconds: number) {
  try {
    localStorage.setItem(localKey(id), String(Math.floor(seconds)));
  } catch {
    // ignore (private mode)
  }
}

/** Resume position: the account's if signed in, else this device's. Near the end counts as finished. */
async function loadPosition(id: string): Promise<number> {
  const local = readLocal(id);
  try {
    const response = await fetch(`${API_BASE_URL}/recordings/${id}/position`, { credentials: "same-origin" });
    if (response.ok) {
      const { data } = (await response.json()) as { data: { positionSeconds: number } };
      return Math.max(data.positionSeconds, local);
    }
  } catch {
    // offline: use this device's
  }
  return local;
}

function savePosition(id: string, seconds: number) {
  writeLocal(id, seconds);
  void fetch(`${API_BASE_URL}/recordings/${id}/position`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ positionSeconds: Math.floor(seconds) }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Replays (requirement 21): plain <audio> with Range requests, speed, seek and resume. */
export function useReplayAudio(
  nowPlaying: NowPlaying | null,
  isPlaying: boolean,
  speed: PlaybackSpeed,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  onEnded: () => void,
): UseReplayAudioReturn {
  const replayId = nowPlaying?.kind === "replay" ? nowPlaying.id : null;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  // Load a new recording and jump to where the listener stopped.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !replayId || loadedIdRef.current === replayId) return;
    loadedIdRef.current = replayId;
    audio.srcObject = null;
    audio.preload = "metadata";
    audio.src = `${API_BASE_URL}/recordings/${replayId}/audio`;
    setCurrentTime(0);
    setDuration(0);
    setHasEnded(false);
    void loadPosition(replayId).then((position) => {
      if (loadedIdRef.current !== replayId || !position) return;
      const seekWhenReady = () => {
        if (position < audio.duration - 10) audio.currentTime = position;
      };
      if (audio.readyState >= 1) seekWhenReady();
      else audio.addEventListener("loadedmetadata", seekWhenReady, { once: true });
    });
  }, [replayId, audioRef]);

  useEffect(() => {
    if (!replayId) loadedIdRef.current = null;
  }, [replayId]);

  // Play / pause follow the store; playback only ever starts from a tap that set isPlaying.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !replayId) return;
    if (isPlaying) void audio.play().catch(() => undefined);
    else {
      audio.pause();
      if (audio.currentTime) savePosition(replayId, audio.currentTime);
    }
  }, [isPlaying, replayId, audioRef]);

  useEffect(() => {
    if (audioRef.current && replayId) audioRef.current.playbackRate = speed;
  }, [speed, replayId, audioRef]);

  // Events and periodic saving.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !replayId) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onEnd = () => {
      setHasEnded(true);
      savePosition(replayId, 0);
      onEnded();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnd);
    const timer = setInterval(() => {
      if (!audio.paused && audio.currentTime) savePosition(replayId, audio.currentTime);
    }, SAVE_EVERY_MS);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnd);
      clearInterval(timer);
    };
  }, [replayId, audioRef, onEnded]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || !replayId) return;
      const target = Math.max(0, Math.min(seconds, audio.duration || seconds));
      audio.currentTime = target;
      setCurrentTime(target);
      savePosition(replayId, target);
    },
    [audioRef, replayId],
  );

  return { currentTime, duration, isBuffering, hasEnded, seek };
}
