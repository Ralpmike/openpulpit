import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

const FALLBACK = "Something went wrong. Please try again.";
const OFFLINE = "You seem to be offline. Check your connection and try again.";

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

/** Turns an RTK Query error into plain, friendly text. Never shows stack traces. */
export function getErrorMessage(error: unknown): string {
  if (!error) return FALLBACK;
  if (isFetchBaseQueryError(error)) {
    if (error.status === "FETCH_ERROR") return OFFLINE;
    if (error.status === "TIMEOUT_ERROR") return "That took too long. Check your connection and try again.";
    const data = error.data as { error?: unknown } | undefined;
    if (data && typeof data.error === "string" && data.error.trim()) return data.error;
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 403) return "You don't have permission to do that.";
    if (error.status === 404) return "We couldn't find that. It may have been removed.";
    if (error.status === 429) return "Too many tries. Please wait a moment and try again.";
    return FALLBACK;
  }
  // A SerializedError comes from our own code (a thrown exception); its message is not for people.
  void (error as SerializedError);
  return FALLBACK;
}
