"use client";

import { useEffect } from "react";

/** Keeps the screen on while `isActive` (e.g. while preaching live). Quietly does nothing where unsupported. */
export function useWakeLock(isActive: boolean): void {
  useEffect(() => {
    if (!isActive || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let isCancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (isCancelled) await lock.release();
      } catch {
        // Battery saver or a hidden tab: not critical.
      }
    };
    // The lock is dropped when the page is hidden; take it again when it comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [isActive]);
}
