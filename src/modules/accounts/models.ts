import type { UserRole, UserStatus } from "@/modules/accounts/server/authSchema";

export type { UserRole, UserStatus };

/** The signed-in person as the client sees them. */
export interface Me {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  hasAcceptedTerms: boolean;
}

/** A preacher's public profile (requirement 3). */
export interface PreacherProfile {
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  ministry: string;
  state: string;
  city: string;
  denomination: string;
  photoUrl: string | null;
  isVerified: boolean;
}
