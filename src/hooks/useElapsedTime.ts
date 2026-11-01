"use client";

import { useEffect, useState } from "react";

type UseElapsedTimeReturn = number;

/** Seconds since `startedAt`, ticking once a second (0 when not started). */
export function useElapsedTime(startedAt: string | null): UseElapsedTimeReturn {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}
