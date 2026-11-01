"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/atoms/table";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { formatShortDate } from "@/helpers/format/date";
import { useListAuditLogQuery } from "@/modules/admin/store/endpoints";

/** Every admin action, newest first. Read-only: the log can't be changed (requirement 26). */
export function AuditLog() {
  const { data: rows, isLoading: isAuditLoading } = useListAuditLogQuery();
  if (isAuditLoading) return <SectionLoadingSkeleton rows={5} hasAvatar={false} label="Loading the audit log" />;
  if (!rows?.length) return <p className="text-sm text-muted-foreground">No admin actions yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border" data-testid="audit-log">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap tabular-nums">{formatShortDate(row.createdAt)}</TableCell>
              <TableCell>{row.actorName}</TableCell>
              <TableCell className="font-mono text-xs">{row.action}</TableCell>
              <TableCell className="text-xs">{row.targetType} {row.targetId.slice(0, 8)}</TableCell>
              <TableCell className="max-w-xs text-sm">{row.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
