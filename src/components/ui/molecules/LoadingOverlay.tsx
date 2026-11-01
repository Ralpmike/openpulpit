import { Spinner } from "@/components/ui/atoms/spinner";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  label?: string;
  variant?: "page" | "section";
  className?: string;
}

/** Covers a page or one card while its main data loads. */
export function LoadingOverlay({ label = "Loading", variant = "page", className }: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="loading-overlay"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        variant === "page" ? "min-h-[50dvh]" : "min-h-32",
        className,
      )}
    >
      <Spinner className="size-6" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
