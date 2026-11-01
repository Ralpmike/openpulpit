import { WifiOffIcon } from "lucide-react";
import type { Metadata } from "next";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";

export const metadata: Metadata = { title: "You're offline" };
export const dynamic = "force-static";

/** Shown by the service worker when a page can't load without a connection. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOffIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>You&apos;re offline</EmptyTitle>
          <EmptyDescription>Check your data or Wi-Fi, then pull down to refresh. Sermons need a connection to play.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
