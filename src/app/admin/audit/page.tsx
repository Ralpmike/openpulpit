import type { Metadata } from "next";

import { AuditLog } from "@/modules/admin/components/AuditLog";

export const metadata: Metadata = { title: "Audit log · Admin" };

export default function AdminAuditPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <AuditLog />
    </div>
  );
}
