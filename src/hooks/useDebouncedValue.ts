"use client";

import { useEffect, useState } from "react";

type UseDebouncedValueReturn<T> = T;

/** The value, once it has stopped changing for `delayMs` (saves requests while typing on slow data). */
export function useDebouncedValue<T>(value: T, delayMs = 300): UseDebouncedValueReturn<T> {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
