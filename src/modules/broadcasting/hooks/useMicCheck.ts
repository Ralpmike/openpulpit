"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MIC_CAPTURE_OPTIONS } from "@/modules/broadcasting/audio";

export type MicPermission = "unknown" | "granted" | "denied" | "unsupported";

export type UseMicCheckReturn = {
  permission: MicPermission;
  /** 0–1, smoothed input level for the meter. */
  level: number;
  devices: MediaDeviceInfo[];
  deviceId: string | null;
  isChecking: boolean;
  /** True once the mic has picked up sound above a whisper. */
  hasHeardSound: boolean;
  start: (deviceId?: string) => Promise<void>;
  stop: () => void;
};

const HEARD_THRESHOLD = 0.08;

/** Asks for the microphone and measures its level so the preacher can see it works (requirement 6). */
export function useMicCheck(): UseMicCheckReturn {
  const [permission, setPermission] = useState<MicPermission>("unknown");
  const [level, setLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasHeardSound, setHasHeardSound] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close().catch(() => undefined);
    contextRef.current = null;
    setIsChecking(false);
    setLevel(0);
  }, []);

  const start = useCallback(
    async (nextDeviceId?: string) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPermission("unsupported");
        return;
      }
      stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { ...MIC_CAPTURE_OPTIONS, ...(nextDeviceId ? { deviceId: { exact: nextDeviceId } } : {}) },
        });
        streamRef.current = stream;
        setPermission("granted");
        setIsChecking(true);
        setDeviceId(stream.getAudioTracks()[0]?.getSettings().deviceId ?? nextDeviceId ?? null);
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((device) => device.kind === "audioinput"));

        const context = new AudioContext();
        contextRef.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        let smoothed = 0;
        const tick = () => {
          analyser.getByteTimeDomainData(samples);
          let sum = 0;
          for (const sample of samples) {
            const centered = (sample - 128) / 128;
            sum += centered * centered;
          }
          const rms = Math.sqrt(sum / samples.length);
          smoothed = Math.max(rms * 3, smoothed * 0.85);
          const clamped = Math.min(1, smoothed);
          setLevel(clamped);
          if (clamped > HEARD_THRESHOLD) setHasHeardSound(true);
          frameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (error) {
        const name = (error as DOMException).name;
        setPermission(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported");
        setIsChecking(false);
      }
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { permission, level, devices, deviceId, isChecking, hasHeardSound, start, stop };
}
