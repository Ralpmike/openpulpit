import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/atoms/avatar";
import { initials } from "@/helpers/text/slug";
import { cn } from "@/lib/utils";

export interface PreacherAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "size-10", md: "size-12", lg: "size-20" } as const;

/** A preacher's photo, or their initials when there is none. Decorative next to their name. */
export function PreacherAvatar({ name, photoUrl, size = "md", className }: PreacherAvatarProps) {
  return (
    <Avatar data-testid="preacher-avatar" className={cn(SIZES[size], className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt="" loading="lazy" /> : null}
      <AvatarFallback aria-hidden className={size === "lg" ? "text-xl" : undefined}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
