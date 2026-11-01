import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { SignUpPage } from "@/modules/accounts/components/SignUpPage";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return (
    <Suspense fallback={<SectionLoadingSkeleton rows={2} hasAvatar={false} />}>
      <SignUpPage />
    </Suspense>
  );
}
