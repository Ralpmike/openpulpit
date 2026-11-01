import { BadgeCheckIcon } from "lucide-react";
import Link from "next/link";

import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { cn } from "@/lib/utils";

export interface PreacherCardProps {
  name: string;
  slug: string;
  photoUrl: string | null;
  isVerified: boolean;
  ministry: string;
  location: string;
  className?: string;
}

/** A preacher in a list: the whole row links to their profile. */
export function PreacherCard({ name, slug, photoUrl, isVerified, ministry, location, className }: PreacherCardProps) {
  return (
    <Link
      href={`/p/${slug}`}
      data-testid="preacher-card"
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
    >
      <PreacherAvatar name={name} photoUrl={photoUrl} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 font-medium">
          <span className="truncate">{name}</span>
          {isVerified ? (
            <BadgeCheckIcon className="size-4 shrink-0 text-status-good" aria-label="Verified" role="img" />
          ) : null}
        </span>
        <span className="truncate text-sm text-muted-foreground">{[ministry, location].filter(Boolean).join(" · ")}</span>
      </span>
    </Link>
  );
}
