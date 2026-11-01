"use client";

import { RotateCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import { Button } from "@/components/ui/atoms/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Alert variant="destructive" data-testid="page-error" className="mt-2">
      <AlertTitle>This page didn&apos;t load</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        Check your connection and try again.
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCwIcon data-icon="inline-start" aria-hidden />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
