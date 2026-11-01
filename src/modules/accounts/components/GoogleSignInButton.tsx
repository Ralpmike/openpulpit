"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { authClient, authErrorMessage } from "@/lib/authClient";

export interface GoogleSignInButtonProps {
  /** Where to land after Google sends the person back. */
  callbackPath: string;
  label?: string;
}

function GoogleMark() {
  return (
    <svg data-icon="inline-start" aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

export function GoogleSignInButton({ callbackPath, label = "Continue with Google" }: GoogleSignInButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function signInWithGoogle() {
    setIsRedirecting(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackPath,
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setIsRedirecting(false);
      toast.error(authErrorMessage(error));
    }
  }

  return (
    <LoaderButton
      variant="outline"
      size="lg"
      onClick={signInWithGoogle}
      isLoading={isRedirecting}
      loadingLabel="Opening Google…"
      data-testid="google-sign-in-button"
    >
      {isRedirecting ? null : <GoogleMark />}
      {label}
    </LoaderButton>
  );
}
