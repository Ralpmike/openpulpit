"use client";

import { CheckCheckIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { formatRelative } from "@/helpers/format/date";
import type { ReportGroup } from "@/modules/admin/models";
import type { AdminAction } from "@/modules/admin/schemas/actions";
import { ReasonDialog } from "@/modules/admin/components/ReasonDialog";
import { useListReportGroupsQuery, useRunAdminActionMutation } from "@/modules/admin/store/endpoints";
import { REPORT_REASONS } from "@/modules/moderation/schemas/report";

const reasonLabel = (value: string) => REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

function ActionButton({ group, action, label, description, isDestructive = false, targetId }: {
  group: ReportGroup;
  action: AdminAction;
  label: string;
  description: string;
  isDestructive?: boolean;
  targetId: string;
}) {
  const [runAdminAction, { isLoading: isRunAdminActionPending }] = useRunAdminActionMutation();
  return (
    <ReasonDialog
      trigger={
        <Button size="sm" variant={isDestructive ? "destructive" : "outline"} data-testid={`action-${action}`}>
          {label}
        </Button>
      }
      title={`${label}: ${group.title}`}
      description={description}
      confirmLabel={label}
      isDestructive={isDestructive}
      isPending={isRunAdminActionPending}
      onConfirm={async (reason) => {
        try {
          await runAdminAction({ action, targetId, reason }).unwrap();
          toast.success("Done. Recorded in the audit log.");
          return true;
        } catch (error) {
          toast.error(getErrorMessage(error));
          return false;
        }
      }}
    />
  );
}

function ReportGroupCard({ group }: { group: ReportGroup }) {
  const isLive = group.targetType === "broadcast" && group.state === "live";
  const isRecordingHidden = group.targetType === "recording" && group.state.endsWith("hidden_by_admin");
  return (
    <Card data-testid="report-group">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">{group.targetType}</Badge>
          {isLive ? <Badge variant="live">Live now</Badge> : null}
          <Badge variant="warning" className="tabular-nums">
            {group.reportCount} {group.reportCount === 1 ? "report" : "reports"}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatRelative(group.latestAt)}</span>
        </div>
        <CardTitle className="flex items-center gap-2">
          {group.title}
          {group.link ? (
            <Link href={group.link} target="_blank" aria-label={`Open ${group.title}`} className="text-muted-foreground">
              <ExternalLinkIcon aria-hidden className="size-4" />
            </Link>
          ) : null}
        </CardTitle>
        {group.preacherName ? (
          <p className="text-sm text-muted-foreground">
            {group.preacherName} · account {group.preacherStatus}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          <span className="font-medium">Reasons:</span> {group.reasons.map(reasonLabel).join(", ")}
        </p>
        {group.latestDetails ? <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">{group.latestDetails}</blockquote> : null}
        <div className="flex flex-wrap gap-2">
          {isLive ? (
            <ActionButton group={group} action="end_broadcast" targetId={group.targetId} label="End broadcast" isDestructive description="Ends it for everyone now and hides its recording." />
          ) : null}
          {group.targetType === "recording" ? (
            isRecordingHidden ? (
              <ActionButton group={group} action="unhide_recording" targetId={group.targetId} label="Restore recording" description="Makes it public again." />
            ) : (
              <ActionButton group={group} action="hide_recording" targetId={group.targetId} label="Hide recording" isDestructive description="Listeners can no longer find or play it. The preacher can't undo this." />
            )
          ) : null}
          {group.preacherId ? (
            <>
              <ActionButton group={group} action="warn_user" targetId={group.preacherId} label="Warn" description="Marks the account as warned. They can keep preaching." />
              <ActionButton group={group} action="suspend_user" targetId={group.preacherId} label="Suspend" isDestructive description="Signs them out, ends any live broadcast and hides their profile until restored." />
              <ActionButton group={group} action="ban_user" targetId={group.preacherId} label="Ban" isDestructive description="Permanently stops this account. Signs them out and ends any live broadcast." />
            </>
          ) : null}
          <ActionButton group={group} action="dismiss_reports" targetId={`${group.targetType}:${group.targetId}`} label="Dismiss" description="Closes these reports without action (for example, a disagreement about doctrine)." />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportQueue() {
  const { data: groups, isLoading: isReportsLoading, isError: isReportsError, refetch } = useListReportGroupsQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  if (isReportsLoading) return <SectionLoadingSkeleton rows={3} hasAvatar={false} label="Loading reports" />;
  if (isReportsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col items-start gap-2">
          Reports didn&apos;t load.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!groups?.length) {
    return (
      <Empty data-testid="reports-empty-state">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCheckIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No reports waiting</EmptyTitle>
          <EmptyDescription>New reports appear here within a minute.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {groups.map((group) => (
        <li key={`${group.targetType}:${group.targetId}`}>
          <ReportGroupCard group={group} />
        </li>
      ))}
    </ul>
  );
}
