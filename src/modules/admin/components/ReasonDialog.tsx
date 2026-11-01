"use client";

import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/atoms/alert-dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/atoms/field";
import { Textarea } from "@/components/ui/atoms/textarea";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";

export interface ReasonDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isPending: boolean;
  onConfirm: (reason: string) => Promise<boolean>;
}

/** Every admin action asks why; the reason goes into the audit log. */
export function ReasonDialog({ trigger, title, description, confirmLabel, isDestructive = false, isPending, onConfirm }: ReasonDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const isReasonValid = reason.trim().length >= 3;
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="admin-reason">Reason</FieldLabel>
          <Textarea id="admin-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-describedby="admin-reason-help" data-testid="admin-reason" />
          <FieldDescription id="admin-reason-help">Recorded in the audit log with your name.</FieldDescription>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <LoaderButton
            variant={isDestructive ? "destructive" : "default"}
            disabled={!isReasonValid}
            isLoading={isPending}
            onClick={async () => {
              if (await onConfirm(reason.trim())) {
                setIsOpen(false);
                setReason("");
              }
            }}
            data-testid="admin-confirm"
          >
            {confirmLabel}
          </LoaderButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
