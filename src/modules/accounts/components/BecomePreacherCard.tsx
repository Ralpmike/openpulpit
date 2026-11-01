"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { Badge } from "@/components/ui/atoms/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { PreacherApplicationForm } from "@/modules/accounts/components/PreacherApplicationForm";
import type { PreacherApplicationFormValues } from "@/modules/accounts/schemas/auth";
import {
  useApplyToPreachMutation,
  useChooseToPreachMutation,
  useGetRoleOptionsQuery,
} from "@/modules/accounts/store/endpoints";

/** For listeners: become a preacher now (new accounts) or apply for review. */
export function BecomePreacherCard() {
  const router = useRouter();
  const { data: options, isLoading: isOptionsLoading, isError: isOptionsError, refetch } = useGetRoleOptionsQuery();
  const [chooseToPreach, { isLoading: isChooseToPreachPending }] = useChooseToPreachMutation();
  const [applyToPreach, { isLoading: isApplyToPreachPending }] = useApplyToPreachMutation();

  async function becomePreacher() {
    try {
      await chooseToPreach().unwrap();
      toast.success("You're set up as a preacher. Now add your profile.");
      router.push("/profile/edit");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function apply(values: PreacherApplicationFormValues) {
    try {
      await applyToPreach(values).unwrap();
      toast.success("Application sent. We'll review it soon.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const application = options?.application;
  return (
    <Card data-testid="become-preacher-card">
      <CardHeader>
        <CardTitle>Preach on OpenPulpit</CardTitle>
        <CardDescription>Go live from your phone and keep every sermon for your listeners.</CardDescription>
      </CardHeader>
      <CardContent>
        {isOptionsLoading ? (
          <SectionLoadingSkeleton rows={1} hasAvatar={false} />
        ) : isOptionsError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-col items-start gap-2">
              Couldn&apos;t load this.
              <LoaderButton variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </LoaderButton>
            </AlertDescription>
          </Alert>
        ) : options?.canChooseRole ? (
          <LoaderButton onClick={becomePreacher} isLoading={isChooseToPreachPending} loadingLabel="Setting up…" data-testid="become-preacher-button">
            I&apos;m a preacher
          </LoaderButton>
        ) : application?.status === "pending" ? (
          <p className="flex flex-wrap items-center gap-2 text-sm" data-testid="application-pending">
            <Badge variant="warning">Waiting for review</Badge>
            Your application is with our team.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {application?.status === "rejected" ? (
              <p className="text-sm text-muted-foreground">Your last application wasn&apos;t approved. You can apply again.</p>
            ) : null}
            <PreacherApplicationForm onSubmit={apply} isSubmitting={isApplyToPreachPending} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
