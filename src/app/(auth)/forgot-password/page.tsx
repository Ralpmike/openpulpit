import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { ForgotPasswordPage } from "@/modules/accounts/components/ForgotPasswordPage";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <Suspense fallback={<SectionLoadingSkeleton rows={2} hasAvatar={false} />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
