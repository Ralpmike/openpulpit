"use client";

import { BadgeCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/atoms/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/atoms/field";
import { Textarea } from "@/components/ui/atoms/textarea";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { useGetVerificationQuery, useRequestVerificationMutation } from "@/modules/accounts/store/endpoints";

/** The verified badge: status, or a short request for review (requirement 4). */
export function VerificationCard() {
  const { data: verification, isLoading: isVerificationLoading, isError: isVerificationError } = useGetVerificationQuery();
  const [requestVerification, { isLoading: isRequestVerificationPending }] = useRequestVerificationMutation();
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      await requestVerification({ message }).unwrap();
      toast.success("Request sent. We'll review it soon.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card data-testid="verification-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheckIcon aria-hidden className="size-5 text-status-good" />
          Verified badge
        </CardTitle>
        <CardDescription>Shows listeners that our team has confirmed who you are.</CardDescription>
      </CardHeader>
      <CardContent>
        {isVerificationLoading ? (
          <SectionLoadingSkeleton rows={1} hasAvatar={false} />
        ) : isVerificationError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load your verification status.</p>
        ) : verification?.status === "verified" ? (
          <Badge variant="good" data-testid="verification-verified">Verified</Badge>
        ) : verification?.status === "pending" ? (
          <p className="flex flex-wrap items-center gap-2 text-sm" data-testid="verification-pending">
            <Badge variant="warning">Waiting for review</Badge>
            We&apos;ll update your profile when it&apos;s done.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {verification?.status === "rejected" ? (
              <p className="text-sm text-muted-foreground" data-testid="verification-rejected">
                Your last request wasn&apos;t approved{verification.decisionNote ? `: ${verification.decisionNote}` : "."} You can ask again.
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="verification-message">How can we confirm it&apos;s you? (optional)</FieldLabel>
              <Textarea
                id="verification-message"
                value={message}
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                aria-describedby="verification-message-help"
              />
              <FieldDescription id="verification-message-help">
                For example your church&apos;s website or social page, or a pastor who can vouch for you.
              </FieldDescription>
            </Field>
            <LoaderButton onClick={submit} isLoading={isRequestVerificationPending} loadingLabel="Sending…" data-testid="request-verification-button">
              Ask to be verified
            </LoaderButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
