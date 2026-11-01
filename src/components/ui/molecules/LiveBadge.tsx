import { Badge } from "@/components/ui/atoms/badge";
import { cn } from "@/lib/utils";

export interface LiveBadgeProps {
  className?: string;
}

/** "LIVE" with a dot: colour plus a word, never colour alone. */
export function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <Badge variant="live" data-testid="live-badge" className={cn("gap-1.5", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-live-foreground motion-safe:animate-pulse" />
      Live
    </Badge>
  );
}
