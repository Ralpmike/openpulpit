"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { useAppDispatch } from "@/hooks/store";
import { authClient } from "@/lib/authClient";
import { api } from "@/store/api";

export function SignOutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await authClient.signOut();
    if (error) {
      setIsSigningOut(false);
      toast.error("Couldn't sign you out. Check your connection and try again.");
      return;
    }
    dispatch(api.util.resetApiState());
    router.replace("/");
    router.refresh();
  }

  return (
    <LoaderButton variant="outline" onClick={signOut} isLoading={isSigningOut} loadingLabel="Signing out…" data-testid="sign-out-button">
      <LogOutIcon data-icon="inline-start" aria-hidden />
      Sign out
    </LoaderButton>
  );
}
