"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { authClient, authErrorMessage } from "@/lib/authClient";
import { EmailCodeRequestForm } from "@/modules/accounts/components/EmailCodeForms";
import { ResetPasswordForm } from "@/modules/accounts/components/ResetPasswordForm";
import { useAfterSignIn } from "@/modules/accounts/components/useAfterSignIn";
import type { ResetPasswordFormValues } from "@/modules/accounts/schemas/auth";

export function ForgotPasswordPage() {
  const { finishSignIn } = useAfterSignIn();
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendCode(values: { email: string }) {
    setErrorMessage(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: values.email, type: "forget-password" });
    if (error) return setErrorMessage(authErrorMessage(error));
    setEmail(values.email);
  }

  async function resetPassword({ otp, password }: ResetPasswordFormValues) {
    if (!email) return;
    setErrorMessage(null);
    const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
    if (error) return setErrorMessage(authErrorMessage(error));
    const signIn = await authClient.signIn.email({ email, password });
    if (signIn.error) return setErrorMessage(authErrorMessage(signIn.error));
    finishSignIn();
  }

  return (
    <div className="flex flex-col gap-6" data-testid="forgot-password-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-muted-foreground">We&apos;ll email you a code to set a new one.</p>
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {email ? (
        <ResetPasswordForm email={email} onSubmit={resetPassword} />
      ) : (
        <EmailCodeRequestForm onSubmit={sendCode} submitLabel="Email me a code" />
      )}
      <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
