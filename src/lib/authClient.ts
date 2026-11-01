"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";

/** Browser client for Better Auth's endpoints at /api/auth. */
export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false, input: false },
        status: { type: "string", required: false, input: false },
        termsVersion: { type: "string", required: false, input: false },
      },
    }),
  ],
});

/**
 * Re-reads the session from the server and rewrites the 5-minute session
 * cookie cache. Call after our own routes change role or terms, so pages see
 * the change at once instead of after the cache expires.
 */
export async function refreshSession(): Promise<void> {
  await authClient.getSession({ query: { disableCookieCache: true } }).catch(() => undefined);
}

/** Better Auth's error → a sentence for people. */
export function authErrorMessage(error: { status?: number; message?: string; code?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  if (error.status === 429) return "Too many tries. Please wait a few minutes and try again.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match. Try again, or sign in with a code instead.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "INVALID_OTP":
      return "That code isn't right. Check the email and try again.";
    case "OTP_EXPIRED":
      return "That code has expired. Ask for a new one.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many wrong codes. Ask for a new one.";
  }
  return error.message || "Something went wrong. Please try again.";
}
