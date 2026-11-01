"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { authClient, authErrorMessage } from "@/lib/authClient";
import { SignUpForm } from "@/modules/accounts/components/SignUpForm";
import { useAfterSignIn } from "@/modules/accounts/components/useAfterSignIn";
import type { SignUpFormValues } from "@/modules/accounts/schemas/auth";

export function SignUpPage() {
  const { nextPath, finishSignIn } = useAfterSignIn();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signUp(values: SignUpFormValues) {
    setErrorMessage(null);
    const { error } = await authClient.signUp.email(values);
    if (error) return setErrorMessage(authErrorMessage(error));
    finishSignIn();
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
