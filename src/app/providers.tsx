"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/atoms/sonner";
import { StoreProvider } from "@/store/StoreProvider";

interface ProvidersProps {
  children: ReactNode;
}

/** Client-side providers for the whole app: theme (follows the phone), store and toasts. */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <StoreProvider>
        {children}
        <Toaster position="top-center" />
      </StoreProvider>
    </ThemeProvider>
  );
}
