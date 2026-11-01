"use client";

import Link from "next/link";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/atoms/alert-dialog";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { useAcceptTermsMutation, useGetMeQuery } from "@/modules/accounts/store/endpoints";
import { CURRENT_TERMS_VERSION } from "@/modules/accounts/terms";

/** Signed-in people who haven't accepted the current terms (code or Google sign-up, or a new version). */
export function TermsGate() {
  const { data: me } = useGetMeQuery();
  const [acceptTerms, { isLoading: isAcceptTermsPending }] = useAcceptTermsMutation();
  if (!me || me.hasAcceptedTerms) return null;
  return (
    <AlertDialog open>
      <AlertDialogContent data-testid="terms-gate">
        <AlertDialogHeader>
          <AlertDialogTitle>Our ground rules</AlertDialogTitle>
          <AlertDialogDescription>
            OpenPulpit is open to every preacher and doesn&apos;t judge doctrine. To keep it safe, please read and accept our{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary underline underline-offset-4">
              terms of use
            </Link>{" "}
            and{" "}
            <Link href="/guidelines" target="_blank" className="font-medium text-primary underline underline-offset-4">
              community guidelines
            </Link>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <LoaderButton
            isLoading={isAcceptTermsPending}
            onClick={() => acceptTerms(CURRENT_TERMS_VERSION).unwrap().catch((error) => toast.error(getErrorMessage(error)))}
            data-testid="accept-terms-button"
          >
            I agree
          </LoaderButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
