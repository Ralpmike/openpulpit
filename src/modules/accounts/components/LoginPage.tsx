"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { Button } from "@/components/ui/atoms/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/atoms/tabs";
import { FieldSeparator } from "@/components/ui/atoms/field";
import { authClient, authErrorMessage } from "@/lib/authClient";
import { GoogleSignInButton } from "@/modules/accounts/components/GoogleSignInButton";
import { EmailCodeRequestForm, EmailCodeVerifyForm } from "@/modules/accounts/components/EmailCodeForms";
import { PasswordSignInForm } from "@/modules/accounts/components/PasswordSignInForm";
import { useAfterSignIn } from "@/modules/accounts/components/useAfterSignIn";

export interface LoginPageProps {
  isGoogleEnabled: boolean;
}

export function LoginPage({ isGoogleEnabled }: LoginPageProps) {
  const { nextPath, finishSignIn } = useAfterSignIn();
  const searchParams = useSearchParams();
  const isGoogleError = searchParams.get("error") === "google";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [codeEmail, setCodeEmail] = useState<string | null>(null);

  async function sendCode({ email }: { email: string }) {
    setErrorMessage(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    if (error) return setErrorMessage(authErrorMessage(error));
    setCodeEmail(email);
  }

  async function verifyCode({ otp }: { otp: string }) {
    if (!codeEmail) return;
    setErrorMessage(null);
    const { error } = await authClient.signIn.emailOtp({ email: codeEmail, otp });
    if (error) return setErrorMessage(authErrorMessage(error));
    finishSignIn();
  }

  async function signInWithPassword({ email, password }: { email: string; password: string }) {
    setErrorMessage(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) return setErrorMessage(authErrorMessage(error));
    finishSignIn();
  }

  const signUpHref = nextPath === "/" ? "/signup" : `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="flex flex-col gap-6" data-testid="login-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-muted-foreground">Follow preachers, get told when they go live, and go live yourself.</p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive" data-testid="sign-in-error">
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

      <Tabs defaultValue="code" onValueChange={() => setErrorMessage(null)}>
        <TabsList className="w-full">
          <TabsTrigger value="code">Email code</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="pt-4">
          {codeEmail ? (
            <div className="flex flex-col gap-3">
              <EmailCodeVerifyForm email={codeEmail} onSubmit={verifyCode} />
              <Button variant="ghost" onClick={() => setCodeEmail(null)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <EmailCodeRequestForm onSubmit={sendCode} />
          )}
        </TabsContent>
        <TabsContent value="password" className="flex flex-col gap-3 pt-4">
          <PasswordSignInForm onSubmit={signInWithPassword} />
          <Button variant="link" asChild className="self-start px-0">
            <Link href="/forgot-password">Forgot your password?</Link>
          </Button>
        </TabsContent>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        New to OpenPulpit?{" "}
        <Link href={signUpHref} className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
