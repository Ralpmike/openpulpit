"use client";

import type { Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { MIC_CAPTURE_OPTIONS, MIC_PUBLISH_OPTIONS } from "@/modules/broadcasting/audio";
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
export function useLiveBroadcast(): UseLiveBroadcastReturn {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("idle");
  const [listenerCount, setListenerCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [getPublishToken] = useGetPublishTokenMutation();

  const start = useCallback(
    async (broadcastId: string, deviceId?: string | null) => {
      setErrorMessage(null);
      setConnectionState("connecting");
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
          .on(RoomEvent.Disconnected, () => setConnectionState((state) => (state === "failed" ? state : "disconnected")));
        await room.connect(grant.url, grant.token);
        await room.localParticipant.setMicrophoneEnabled(
          true,
          { ...MIC_CAPTURE_OPTIONS, ...(deviceId ? { deviceId } : {}) },
          MIC_PUBLISH_OPTIONS,
        );
        countListeners();
        setConnectionState("live");
        return true;
      } catch (error) {
        await roomRef.current?.disconnect().catch(() => undefined);
        roomRef.current = null;
        setConnectionState("failed");
        setErrorMessage(
          error && typeof error === "object" && "status" in error
            ? getErrorMessage(error)
            : "Couldn't connect. Check your connection and try again.",
        );
        return false;
      }
    },
    [getPublishToken],
  );

  const disconnect = useCallback(async () => {
    await roomRef.current?.disconnect();
    roomRef.current = null;
    setConnectionState("disconnected");
  }, []);

  useEffect(
    () => () => {
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
