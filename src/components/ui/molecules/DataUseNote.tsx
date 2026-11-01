import { SignalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DataUseNoteProps {
  /** e.g. "About 14 MB per hour" — from helpers/audio/dataUse. */
  label: string;
  className?: string;
}

/** Tells listeners roughly how much mobile data listening uses (requirement 14). */
export function DataUseNote({ label, className }: DataUseNoteProps) {
  return (
    <p className={cn("flex items-center justify-center gap-1.5 text-sm text-muted-foreground", className)} data-testid="data-use-note">
      <SignalIcon aria-hidden className="size-4" />
      <span>
        {label} <span className="sr-only">of mobile data</span>
      </span>
    </p>
  );
}
