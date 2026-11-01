"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { FieldSeparator } from "@/components/ui/atoms/field";
import { authClient, authErrorMessage, refreshSession } from "@/lib/authClient";
import { GoogleSignInButton } from "@/modules/accounts/components/GoogleSignInButton";
import { SignUpForm } from "@/modules/accounts/components/SignUpForm";
import { useAcceptTermsMutation, useChooseToPreachMutation } from "@/modules/accounts/store/endpoints";
import { CURRENT_TERMS_VERSION } from "@/modules/accounts/terms";
import { useAfterSignIn } from "@/modules/accounts/components/useAfterSignIn";
import type { SignUpFormValues } from "@/modules/accounts/schemas/auth";

export interface SignUpPageProps {
  isGoogleEnabled: boolean;
}

export function SignUpPage({ isGoogleEnabled }: SignUpPageProps) {
  const { nextPath, finishSignIn } = useAfterSignIn();
  const searchParams = useSearchParams();
  const isGoogleError = searchParams.get("error") === "google";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chooseToPreach] = useChooseToPreachMutation();
  const [acceptTerms] = useAcceptTermsMutation();

  async function signUp(values: SignUpFormValues) {
    setErrorMessage(null);
    const { role, acceptsTerms: _acceptsTerms, ...account } = values;
    void _acceptsTerms;
    const { error } = await authClient.signUp.email(account);
    if (error) return setErrorMessage(authErrorMessage(error));
    // Recorded with its version; if this fails, the terms prompt asks again after sign-in.
    await acceptTerms(CURRENT_TERMS_VERSION).unwrap().catch(() => undefined);
    if (role === "preacher") {
      try {
        await chooseToPreach().unwrap();
      } catch {
        // The account exists; they can still pick "I'm a preacher" from their account page.
        return finishSignIn("/account");
      }
    }
    await refreshSession();
    // New preachers set up their public profile next (requirement 3).
    finishSignIn(role === "preacher" ? "/profile/edit" : "/");
  }

  const loginHref = nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="flex flex-col gap-6" data-testid="sign-up-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-muted-foreground">It takes a minute. Listening never needs an account.</p>
      </div>
      {errorMessage ? (
        <Alert variant="destructive" data-testid="sign-up-error">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {isGoogleError && !errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>Google sign-in didn&apos;t finish. Try again, or use your email.</AlertDescription>
        </Alert>
      ) : null}

      {isGoogleEnabled ? (
        <div className="flex flex-col gap-4">
          <GoogleSignInButton callbackPath={nextPath} />
          <FieldSeparator>or</FieldSeparator>
        </div>
      ) : null}

      <SignUpForm onSubmit={signUp} />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
