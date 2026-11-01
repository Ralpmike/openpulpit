"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useAppDispatch } from "@/hooks/store";
import { safeNextPath } from "@/lib/schemas/common";
import { api } from "@/store/api";

type UseAfterSignInReturn = {
  nextPath: string;
  finishSignIn: (fallback?: string) => void;
};

/** After any sign-in: refresh who we are and go back to where the person was. */
export function useAfterSignIn(): UseAfterSignInReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const nextPath = safeNextPath(searchParams.get("next"));
  const finishSignIn = useCallback(
    (fallback?: string) => {
      dispatch(api.util.resetApiState());
      router.replace(safeNextPath(searchParams.get("next"), fallback ?? "/"));
      router.refresh();
    },
    [dispatch, router, searchParams],
  );
  return { nextPath, finishSignIn };
}
