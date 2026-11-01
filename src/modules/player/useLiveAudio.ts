"use client";

import type { Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { FINAL_DISCONNECT_REASONS, rejoinDelay } from "@/modules/broadcasting/reconnect";
import { useGetListenTokenMutation } from "@/modules/broadcasting/store/endpoints";

export type LiveAudioState = "idle" | "connecting" | "playing" | "reconnecting" | "ended" | "blocked" | "failed";

export type UseLiveAudioReturn = {
  state: LiveAudioState;
  errorMessage: string | null;
  /** Browsers that block autoplay need one more tap. */
  unblock: () => void;
};

const MAX_LISTENER_RETRIES = 8;

/**
 * Listens to one live broadcast: subscribe-only token, LiveKit (loaded on
 * demand), the preacher's audio into a hidden <audio> element. Rejoins after a
 * drop while the broadcast is still live.
 */
export function useLiveAudio(broadcastId: string | null, isPlaying: boolean, audioRef: React.RefObject<HTMLAudioElement | null>): UseLiveAudioReturn {
  const roomRef = useRef<Room | null>(null);
  const [state, setState] = useState<LiveAudioState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [getListenToken] = useGetListenTokenMutation();

  const unblock = useCallback(() => {
    void roomRef.current?.startAudio().then(() => setState("playing"));
  }, []);

  useEffect(() => {
    if (!broadcastId || !isPlaying) {
      void roomRef.current?.disconnect();
      roomRef.current = null;
      return;
    }
    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const join = async (attempt: number): Promise<void> => {
      setState(attempt ? "reconnecting" : "connecting");
      try {
        const [grant, { Room, RoomEvent, Track }] = await Promise.all([
          getListenToken(broadcastId).unwrap(),
          import("livekit-client"),
        ]);
        if (isCancelled) return;
        const room = new Room({ adaptiveStream: true, dynacast: false });
        roomRef.current = room;
        room
          .on(RoomEvent.TrackSubscribed, (track) => {
            if (track.kind === Track.Kind.Audio && audioRef.current) track.attach(audioRef.current);
          })
          .on(RoomEvent.Reconnecting, () => setState("reconnecting"))
          .on(RoomEvent.Reconnected, () => setState("playing"))
          .on(RoomEvent.AudioPlaybackStatusChanged, () => setState(room.canPlaybackAudio ? "playing" : "blocked"))
          .on(RoomEvent.Disconnected, (reason?: number) => {
            if (isCancelled) return;
            if (reason !== undefined && FINAL_DISCONNECT_REASONS.has(reason)) {
              setState("ended");
              return;
            }
            if (attempt >= MAX_LISTENER_RETRIES) {
              setState("failed");
              setErrorMessage("Lost the connection. Tap play to try again.");
              return;
            }
            setState("reconnecting");
            retryTimer = setTimeout(() => void join(attempt + 1), rejoinDelay(attempt));
          });
        await room.connect(grant.url, grant.token);
        if (isCancelled) return;
        setState(room.canPlaybackAudio ? "playing" : "blocked");
      } catch (error) {
        if (isCancelled) return;
        const status = (error as { status?: number }).status;
        // 409: the broadcast ended (or hasn't started); don't keep retrying.
        if (status === 409 || status === 404) {
          setState("ended");
          setErrorMessage(getErrorMessage(error));
          return;
        }
        if (attempt < MAX_LISTENER_RETRIES) {
          setState("reconnecting");
          retryTimer = setTimeout(() => void join(attempt + 1), rejoinDelay(attempt));
          return;
        }
        setState("failed");
        setErrorMessage(getErrorMessage(error));
      }
    };

    void join(0);
    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      void roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [broadcastId, isPlaying, getListenToken, audioRef]);

  return { state: broadcastId && isPlaying ? state : "idle", errorMessage, unblock };
}
