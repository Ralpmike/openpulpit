"use client";

import { RadioIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/atoms/alert-dialog";
import { Button } from "@/components/ui/atoms/button";
import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { BiblePassage, BroadcastDetailsForm } from "@/modules/broadcasting/components/BroadcastDetailsForm";
import { MicCheck } from "@/modules/broadcasting/components/MicCheck";
import { useLiveBroadcast } from "@/modules/broadcasting/hooks/useLiveBroadcast";
import { useMicCheck } from "@/modules/broadcasting/hooks/useMicCheck";
import type { Broadcast } from "@/modules/broadcasting/models";
import type { BroadcastDetailsFormValues } from "@/modules/broadcasting/schemas/broadcast";
import { useCreateBroadcastMutation } from "@/modules/broadcasting/store/endpoints";

type Step = "details" | "check" | "live";

/** Details → mic check → one tap to go live (requirement 6). */
export function GoLivePage() {
  const [step, setStep] = useState<Step>("details");
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const mic = useMicCheck();
  const live = useLiveBroadcast();
  const [createBroadcast, { isLoading: isCreateBroadcastPending }] = useCreateBroadcastMutation();

  async function saveDetails(values: BroadcastDetailsFormValues) {
    try {
      setBroadcast(await createBroadcast(values).unwrap());
      setStep("check");
      await mic.start();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function goLive() {
    if (!broadcast) return;
    setIsConfirmOpen(false);
    const deviceId = mic.deviceId;
    mic.stop();
    if (await live.start(broadcast.id, deviceId)) setStep("live");
  }

  const isConnecting = live.connectionState === "connecting";

  return (
    <div className="flex flex-col gap-6" data-testid="go-live-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{step === "live" ? broadcast?.title : "Go live"}</h1>
        {step !== "live" ? <p className="text-muted-foreground">Preach from your phone. Every broadcast is recorded for replay.</p> : null}
        {step !== "details" && broadcast ? <BiblePassage passage={broadcast.biblePassage} /> : null}
      </div>

      {step === "details" ? <BroadcastDetailsForm onSubmit={saveDetails} isSubmitting={isCreateBroadcastPending} /> : null}

      {step === "check" ? (
        <div className="flex flex-col gap-5">
          <MicCheck mic={mic} />
          {live.errorMessage ? (
            <Alert variant="destructive" data-testid="go-live-error">
              <AlertDescription>{live.errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <LoaderButton
            size="lg"
            className="h-14 text-lg"
            disabled={mic.permission !== "granted"}
            isLoading={isConnecting}
            loadingLabel="Going live…"
            onClick={() => setIsConfirmOpen(true)}
            data-testid="go-live-button"
          >
            <RadioIcon data-icon="inline-start" aria-hidden />
            Go live
          </LoaderButton>
          {mic.permission !== "granted" ? (
            <p className="text-sm text-muted-foreground">Allow your microphone to go live.</p>
          ) : null}
        </div>
      ) : null}

      {step === "live" ? (
        <div className="flex flex-col gap-4" data-testid="live-view">
          <div className="flex items-center gap-3" aria-live="polite">
            <LiveBadge />
            <span className="text-sm text-muted-foreground">
              {live.isReconnecting ? "Connection dropped. Reconnecting…" : "You're live"}
            </span>
          </div>
          <p className="text-3xl font-semibold tabular-nums" data-testid="listener-count">
            {live.listenerCount} <span className="text-base font-normal text-muted-foreground">listening</span>
          </p>
          <Button variant="outline" onClick={() => live.disconnect()}>
            Leave
          </Button>
        </div>
      ) : null}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go live now?</AlertDialogTitle>
            <AlertDialogDescription>
              Your followers will be told you&apos;re live, and anyone can listen. The broadcast is recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={goLive} data-testid="confirm-go-live">
              Go live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
