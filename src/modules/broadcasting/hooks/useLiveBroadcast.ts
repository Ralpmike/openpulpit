"use client";

import type { Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { MIC_CAPTURE_OPTIONS, MIC_PUBLISH_OPTIONS } from "@/modules/broadcasting/audio";
import { FINAL_DISCONNECT_REASONS, rejoinDelay, shouldKeepRejoining } from "@/modules/broadcasting/reconnect";
import { useGetPublishTokenMutation } from "@/modules/broadcasting/store/endpoints";

export type LiveConnectionState = "idle" | "connecting" | "live" | "reconnecting" | "disconnected" | "failed";

export type UseLiveBroadcastReturn = {
  connectionState: LiveConnectionState;
  isReconnecting: boolean;
  /** Listeners in the room right now (never the preacher). */
  listenerCount: number;
  errorMessage: string | null;
  start: (broadcastId: string, deviceId?: string | null) => Promise<boolean>;
  disconnect: () => Promise<void>;
};

/**
 * The preacher's side of a live broadcast: gets a publish token, connects to
 * LiveKit and publishes the microphone with the data-light audio settings.
 * livekit-client is loaded only here, never in the shared bundle.
 */
const RECONNECT_GRACE_SECONDS = 60;

export function useLiveBroadcast(): UseLiveBroadcastReturn {
  const roomRef = useRef<Room | null>(null);
  const isIntentionalRef = useRef(false);
  const sessionRef = useRef<{ broadcastId: string; deviceId?: string | null } | null>(null);
  const rejoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDroppedRef = useRef<(reason?: number) => void>(() => undefined);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("idle");
  const [listenerCount, setListenerCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [getPublishToken] = useGetPublishTokenMutation();

  const connect = useCallback(
    async (broadcastId: string, deviceId: string | null | undefined, onDropped: (reason?: number) => void) => {
      try {
        const [grant, { Room, RoomEvent }] = await Promise.all([
          getPublishToken(broadcastId).unwrap(),
          import("livekit-client"),
        ]);
        const room = new Room({ adaptiveStream: false, dynacast: false, disconnectOnPageLeave: false });
        roomRef.current = room;
        const countListeners = () => setListenerCount(room.remoteParticipants.size);
        room
          .on(RoomEvent.Reconnecting, () => setConnectionState("reconnecting"))
          .on(RoomEvent.SignalReconnecting, () => setConnectionState("reconnecting"))
          .on(RoomEvent.Reconnected, () => setConnectionState("live"))
          .on(RoomEvent.ParticipantConnected, countListeners)
          .on(RoomEvent.ParticipantDisconnected, countListeners)
          .on(RoomEvent.Disconnected, (reason?: number) => onDropped(reason));
        await room.connect(grant.url, grant.token);
        await room.localParticipant.setMicrophoneEnabled(
          true,
          { ...MIC_CAPTURE_OPTIONS, ...(deviceId ? { deviceId } : {}) },
          MIC_PUBLISH_OPTIONS,
        );
        countListeners();
        setConnectionState("live");
        return { ok: true as const };
      } catch (error) {
        await roomRef.current?.disconnect().catch(() => undefined);
        roomRef.current = null;
        const isRefused = Boolean(error && typeof error === "object" && "status" in error);
        return {
          ok: false as const,
          isRefused,
          message: isRefused ? getErrorMessage(error) : "Couldn't connect. Check your connection and try again.",
        };
      }
    },
    [getPublishToken],
  );

  /**
   * LiveKit retries brief drops itself. If it gives up, rejoin with a fresh
   * token (back-off) while the server still holds the broadcast live.
   */
  const handleDropped = useCallback(
    (reason?: number) => {
      const session = sessionRef.current;
      if (isIntentionalRef.current || !session || (reason !== undefined && FINAL_DISCONNECT_REASONS.has(reason))) {
        setConnectionState((state) => (state === "failed" ? state : "disconnected"));
        return;
      }
      const droppedAt = Date.now();
      setConnectionState("reconnecting");
      const attemptRejoin = (attempt: number) => {
        if (!shouldKeepRejoining({ droppedAt, now: Date.now(), graceSeconds: RECONNECT_GRACE_SECONDS, wasIntentional: isIntentionalRef.current })) {
          setConnectionState("failed");
          setErrorMessage("We couldn't reconnect in time, so the broadcast ended. Your recording is saved.");
          return;
        }
        rejoinTimerRef.current = setTimeout(async () => {
          const result = await connect(session.broadcastId, session.deviceId, handleDroppedRef.current);
          if (result.ok) return;
          // Refused (ended by an admin, out of hours): stop trying.
          if (result.isRefused) {
            setConnectionState("failed");
            setErrorMessage(result.message);
            return;
          }
          attemptRejoin(attempt + 1);
        }, attempt === 0 && typeof navigator !== "undefined" && navigator.onLine ? 0 : rejoinDelay(attempt));
      };
      attemptRejoin(0);
    },
    [connect],
  );
  useEffect(() => {
    handleDroppedRef.current = handleDropped;
  }, [handleDropped]);

  // Back online: don't wait for the next back-off step.
  useEffect(() => {
    const onOnline = () => {
      if (rejoinTimerRef.current && sessionRef.current) {
        clearTimeout(rejoinTimerRef.current);
        rejoinTimerRef.current = null;
        handleDroppedRef.current();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const start = useCallback(
    async (broadcastId: string, deviceId?: string | null) => {
      isIntentionalRef.current = false;
      sessionRef.current = { broadcastId, deviceId };
      setErrorMessage(null);
      setConnectionState("connecting");
      const result = await connect(broadcastId, deviceId, (reason) => handleDroppedRef.current(reason));
      if (!result.ok) {
        sessionRef.current = null;
        setConnectionState("failed");
        setErrorMessage(result.message);
      }
      return result.ok;
    },
    [connect],
  );

  const disconnect = useCallback(async () => {
    isIntentionalRef.current = true;
    sessionRef.current = null;
    if (rejoinTimerRef.current) clearTimeout(rejoinTimerRef.current);
    await roomRef.current?.disconnect();
    roomRef.current = null;
    setConnectionState("disconnected");
  }, []);

  useEffect(
    () => () => {
      isIntentionalRef.current = true;
      if (rejoinTimerRef.current) clearTimeout(rejoinTimerRef.current);
      void roomRef.current?.disconnect();
    },
    [],
  );

  return {
    connectionState,
    isReconnecting: connectionState === "reconnecting",
    listenerCount,
    errorMessage,
    start,
    disconnect,
  };
}
