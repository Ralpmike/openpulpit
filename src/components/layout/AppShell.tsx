import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import type { NavAudience } from "@/components/layout/navItems";

export interface AppShellProps {
  audience: NavAudience;
  headerActions?: ReactNode;
  /** The persistent player bar, fixed above the bottom navigation. */
  player?: ReactNode;
  children: ReactNode;
}

/** Mobile-first frame: header, one readable column, player bar and bottom nav. */
export function AppShell({ audience, headerActions, player, children }: AppShellProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-nav rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Header actions={headerActions} />
      <main
        id="main"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-chrome"
      >
        {children}
      </main>
      {player}
      <BottomNav audience={audience} />
    </>
  );
}
