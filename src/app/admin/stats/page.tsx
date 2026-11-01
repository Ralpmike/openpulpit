import type { Metadata } from "next";

import { PlatformStatsView } from "@/modules/admin/components/PlatformStatsView";

export const metadata: Metadata = { title: "Stats · Admin" };

export default function AdminStatsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Platform stats</h1>
      <PlatformStatsView />
    </div>
  );
}
