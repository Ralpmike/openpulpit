"use client";

import { useEffect } from "react";

/** Registers /sw.js (offline page, cached app shell, go-live notifications). Production only. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
