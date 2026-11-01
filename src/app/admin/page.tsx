import type { Metadata } from "next";

import { ReportQueue } from "@/modules/admin/components/ReportQueue";

export const metadata: Metadata = { title: "Reports · Admin" };

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <ReportQueue />
    </div>
  );
}
