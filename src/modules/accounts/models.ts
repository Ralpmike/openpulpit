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
