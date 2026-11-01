import Link from "next/link";
import type { ReactNode } from "react";

export interface HeaderProps {
  /** Right-hand slot (account menu, sign-in link). */
  actions?: ReactNode;
}

export function Header({ actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-header border-b bg-background/95 supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
            OP
          </span>
          OpenPulpit
        </Link>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
