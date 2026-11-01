import { AppShell } from "@/components/layout/AppShell";
import type { NavAudience } from "@/components/layout/navItems";
import { getViewer } from "@/modules/accounts";
import { PlayerBar } from "@/modules/player/PlayerBar";
import { PlayerProvider } from "@/modules/player/PlayerProvider";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  const audience: NavAudience = viewer ? viewer.role : "guest";
  return (
    <PlayerProvider>
      <AppShell audience={audience} player={<PlayerBar />}>
        {children}
      </AppShell>
    </PlayerProvider>
  );
}
