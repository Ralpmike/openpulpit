import { Skeleton } from "@/components/ui/atoms/skeleton";
import { cn } from "@/lib/utils";

export interface SectionLoadingSkeletonProps {
  /** How many rows to sketch, matching the list that will load. */
  rows?: number;
  /** Show a round avatar at the start of each row (preacher and recording lists). */
  hasAvatar?: boolean;
  label?: string;
  className?: string;
}

/** A structural placeholder for a list or card while it loads. */
export function SectionLoadingSkeleton({
  rows = 3,
  hasAvatar = true,
  label = "Loading",
  className,
}: SectionLoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      data-testid="section-loading-skeleton"
      className={cn("flex flex-col gap-4", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          {hasAvatar ? <Skeleton className="size-12 shrink-0 rounded-full" /> : null}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
