import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { isGoogleSignInEnabled } from "@/lib/auth";
import { LoginPage } from "@/modules/accounts/components/LoginPage";

export const metadata: Metadata = { title: "Sign in" };

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<SectionLoadingSkeleton rows={2} hasAvatar={false} />}>
      <LoginPage isGoogleEnabled={isGoogleSignInEnabled()} />
    </Suspense>
  );
}
