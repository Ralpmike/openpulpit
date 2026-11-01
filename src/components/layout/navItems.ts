import { HeartIcon, HomeIcon, MicIcon, SearchIcon, UserIcon, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export type NavAudience = "guest" | "listener" | "preacher" | "admin";

/** Bottom navigation by who is signed in. Preachers get Go live in the middle. */
export function navItemsFor(audience: NavAudience): NavItem[] {
  const home = { href: "/", label: "Home", icon: HomeIcon };
  const search = { href: "/search", label: "Search", icon: SearchIcon };
  const following = { href: "/following", label: "Following", icon: HeartIcon };
  const account = { href: audience === "guest" ? "/login" : "/account", label: audience === "guest" ? "Sign in" : "You", icon: UserIcon };
  if (audience === "preacher") {
    return [home, search, { href: "/go-live", label: "Go live", icon: MicIcon }, following, account];
  }
  return [home, search, following, account];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
