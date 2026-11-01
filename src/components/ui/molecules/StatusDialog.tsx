"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/atoms/dialog";

export interface StatusDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  icon?: ReactNode;
  title: string;
  description: string;
  /** Up to two buttons. */
  actions?: ReactNode;
}

/** A milestone ("You're live", "Broadcast ended"): icon, title, a line or two, up to two actions. */
export function StatusDialog({ isOpen, onOpenChange, icon, title, description, actions }: StatusDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent data-testid="status-dialog" className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          {icon ? <div className="mb-2 text-primary">{icon}</div> : null}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {actions ? <DialogFooter className="flex-col gap-2 sm:flex-col">{actions}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
