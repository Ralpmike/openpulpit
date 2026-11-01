"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/atoms/sonner";
import { StoreProvider } from "@/store/StoreProvider";

interface ProvidersProps {
  children: ReactNode;
}

/** Client-side providers for the whole app: the Redux store and toasts. */
export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      {children}
      <Toaster position="top-center" />
    </StoreProvider>
  );
}
