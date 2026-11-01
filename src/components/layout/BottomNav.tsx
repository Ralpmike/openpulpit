"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, navItemsFor, type NavAudience } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";

export interface BottomNavProps {
  audience: NavAudience;
}

export function BottomNav({ audience }: BottomNavProps) {
  const pathname = usePathname();
  const items = navItemsFor(audience);
  return (
    <nav
      aria-label="Main"
      data-testid="bottom-nav"
      className="fixed inset-x-0 bottom-0 z-nav border-t bg-background/95 pb-safe backdrop-blur-sm supports-backdrop-filter:bg-background/85"
    >
      <ul className="mx-auto flex h-nav max-w-xl items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = isNavItemActive(pathname, href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
