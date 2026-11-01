"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { formatRelative } from "@/helpers/format/date";
import { ReasonDialog } from "@/modules/admin/components/ReasonDialog";
import {
  useDecideApplicationMutation,
  useDecideVerificationMutation,
  useListPendingApplicationsQuery,
  useListPendingVerificationsQuery,
} from "@/modules/admin/store/endpoints";

function Decide({ title, onDecide, isPending }: { title: string; isPending: boolean; onDecide: (decision: "approve" | "reject", reason: string) => Promise<void> }) {
  const run = (decision: "approve" | "reject") => async (reason: string) => {
    try {
      await onDecide(decision, reason);
      toast.success(decision === "approve" ? "Approved" : "Rejected");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };
  return (
    <div className="flex gap-2">
      <ReasonDialog trigger={<Button size="sm">Approve</Button>} title={`Approve ${title}?`} description="The person is told on their account page." confirmLabel="Approve" isPending={isPending} onConfirm={run("approve")} />
      <ReasonDialog trigger={<Button size="sm" variant="outline">Reject</Button>} title={`Reject ${title}?`} description="Your reason is shown to them so they can try again." confirmLabel="Reject" isDestructive isPending={isPending} onConfirm={run("reject")} />
    </div>
  );
}

export function ReviewQueues() {
  const { data: applications, isLoading: isApplicationsLoading } = useListPendingApplicationsQuery();
  const { data: verifications, isLoading: isVerificationsLoading } = useListPendingVerificationsQuery();
  const [decideApplication, { isLoading: isDecideApplicationPending }] = useDecideApplicationMutation();
  const [decideVerification, { isLoading: isDecideVerificationPending }] = useDecideVerificationMutation();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section aria-labelledby="applications-heading" className="flex flex-col gap-3">
        <h2 id="applications-heading" className="text-lg font-semibold">Preacher applications</h2>
        {isApplicationsLoading ? <SectionLoadingSkeleton rows={2} hasAvatar={false} /> : !applications?.length ? (
          <p className="text-sm text-muted-foreground">No applications waiting.</p>
        ) : (
          applications.map((application) => (
            <Card key={application.id} data-testid="pending-application">
              <CardHeader>
                <CardTitle>{application.name}</CardTitle>
                <CardDescription>{application.ministry} · {application.email} · {formatRelative(application.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {application.note ? <p className="text-sm whitespace-pre-line">{application.note}</p> : null}
                <Decide title={application.name} isPending={isDecideApplicationPending} onDecide={async (decision, reason) => void (await decideApplication({ id: application.id, decision, reason }).unwrap())} />
              </CardContent>
            </Card>
          ))
        )}
      </section>
      <section aria-labelledby="verifications-heading" className="flex flex-col gap-3">
        <h2 id="verifications-heading" className="text-lg font-semibold">Verified badge requests</h2>
        {isVerificationsLoading ? <SectionLoadingSkeleton rows={2} hasAvatar={false} /> : !verifications?.length ? (
          <p className="text-sm text-muted-foreground">No requests waiting.</p>
        ) : (
          verifications.map((request) => (
            <Card key={request.id} data-testid="pending-verification">
              <CardHeader>
                <CardTitle>
                  <Link href={`/p/${request.slug}`} target="_blank" className="underline-offset-4 hover:underline">{request.display_name}</Link>
                </CardTitle>
                <CardDescription>{request.ministry} · {request.city}, {request.state} · {formatRelative(request.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {request.message ? <p className="text-sm whitespace-pre-line">{request.message}</p> : null}
                <Decide title={request.display_name} isPending={isDecideVerificationPending} onDecide={async (decision, reason) => void (await decideVerification({ id: request.id, decision, reason }).unwrap())} />
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
