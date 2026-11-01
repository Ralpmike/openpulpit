import { AppShell } from "@/components/layout/AppShell";
import type { NavAudience } from "@/components/layout/navItems";
import { getViewer } from "@/modules/accounts";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  const audience: NavAudience = viewer ? viewer.role : "guest";
  return <AppShell audience={audience}>{children}</AppShell>;
}
