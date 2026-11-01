"use client";

import { FlagIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/atoms/drawer";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { ReportForm } from "@/modules/moderation/components/ReportForm";
import type { ReportFormValues, ReportTargetType } from "@/modules/moderation/schemas/report";
import { useCreateReportMutation } from "@/modules/moderation/store/endpoints";

const NOUNS: Record<ReportTargetType, string> = { broadcast: "broadcast", recording: "sermon", profile: "profile" };

export interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  isSignedIn: boolean;
  returnPath: string;
}

/** Report a broadcast, recording or profile (requirement 25). Signed-out people sign in first. */
export function ReportButton({ targetType, targetId, isSignedIn, returnPath }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [createReport, { isLoading: isCreateReportPending }] = useCreateReportMutation();
  const noun = NOUNS[targetType];

  if (!isSignedIn) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/login?next=${encodeURIComponent(returnPath)}`} data-testid="report-button">
          <FlagIcon data-icon="inline-start" aria-hidden />
          Report
        </Link>
      </Button>
    );
  }

  async function submit(values: ReportFormValues) {
    try {
      await createReport(values).unwrap();
      toast.success("Thank you. Our team will review your report.");
      setIsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="report-button">
          <FlagIcon data-icon="inline-start" aria-hidden />
          Report
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Report this {noun}</DrawerTitle>
          <DrawerDescription>Reports are private. We don&apos;t judge doctrine, only safety and the law.</DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto w-full max-w-xl overflow-y-auto px-4 pb-6">
          <ReportForm targetType={targetType} targetId={targetId} onSubmit={submit} isSubmitting={isCreateReportPending} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
