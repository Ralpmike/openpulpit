"use client";

import { CheckCircle2Icon, RadioIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { StatusDialog } from "@/components/ui/molecules/StatusDialog";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import { useWakeLock } from "@/hooks/useWakeLock";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { BiblePassage, BroadcastDetailsForm } from "@/modules/broadcasting/components/BroadcastDetailsForm";
import { LiveView } from "@/modules/broadcasting/components/LiveView";
import { MicCheck } from "@/modules/broadcasting/components/MicCheck";
import { useLiveBroadcast } from "@/modules/broadcasting/hooks/useLiveBroadcast";
import { useMicCheck } from "@/modules/broadcasting/hooks/useMicCheck";
import type { Broadcast } from "@/modules/broadcasting/models";
import type { BroadcastDetailsFormValues } from "@/modules/broadcasting/schemas/broadcast";
import {
  useCreateBroadcastMutation,
  useEndBroadcastMutation,
  useSyncBroadcastMutation,
} from "@/modules/broadcasting/store/endpoints";

const HEARTBEAT_MS = 30_000;

const ENDED_MESSAGES: Record<string, string> = {
  hours_cap: "This month's broadcast hours ran out, so the broadcast ended. Your recording is saved.",
  admin: "An OpenPulpit admin ended this broadcast.",
  disconnected: "Your connection was lost for too long, so the broadcast ended. Your recording is saved.",
};

type Step = "details" | "check" | "live" | "ended";

/** Details → mic check → one tap to go live (requirement 6). */
export function GoLivePage() {
  const [step, setStep] = useState<Step>("details");
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const mic = useMicCheck();
  const live = useLiveBroadcast();
  const [createBroadcast, { isLoading: isCreateBroadcastPending }] = useCreateBroadcastMutation();
  const [syncBroadcast] = useSyncBroadcastMutation();
  const [endBroadcast, { isLoading: isEndBroadcastPending }] = useEndBroadcastMutation();
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [endedMessage, setEndedMessage] = useState<string | null>(null);
  const elapsedSeconds = useElapsedTime(startedAt);
  useWakeLock(step === "live");
  const { disconnect } = live;
  const broadcastId = broadcast?.id;

  // Heartbeat while live: marks the broadcast live, keeps counts, and lets the server enforce the hours cap.
  useEffect(() => {
    if (step !== "live" || !broadcastId) return;
    let isCancelled = false;
    const beat = async () => {
      try {
        const result = await syncBroadcast(broadcastId).unwrap();
        if (isCancelled) return;
        if (result.broadcast.startedAt) setStartedAt(result.broadcast.startedAt);
        setRemainingSeconds(result.isHoursWarning ? result.remainingSeconds : null);
        if (result.broadcast.status === "ended") {
          setEndedMessage(ENDED_MESSAGES[result.broadcast.endedReason] ?? null);
          setStep("ended");
          await disconnect();
        }
      } catch {
        // A missed heartbeat is fine on a patchy connection; the next one catches up.
      }
    };
    void beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [step, broadcastId, syncBroadcast, disconnect]);

  async function end() {
    if (!broadcast) return;
    try {
      await endBroadcast(broadcast.id).unwrap();
      await disconnect();
      setStep("ended");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

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
    if (await live.start(broadcast.id, deviceId)) {
      setStartedAt(new Date().toISOString());
      setStep("live");
    }
  }

  const isConnecting = live.connectionState === "connecting";

  return (
    <div className="flex flex-col gap-6" data-testid="go-live-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{step === "live" || step === "ended" ? broadcast?.title : "Go live"}</h1>
        {step === "details" || step === "check" ? <p className="text-muted-foreground">Preach from your phone. Every broadcast is recorded for replay.</p> : null}
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

      {step === "live" && live.connectionState === "failed" && live.errorMessage ? (
        <Alert variant="destructive" data-testid="reconnect-failed">
          <AlertDescription>{live.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {step === "live" ? (
        <LiveView
          elapsedSeconds={elapsedSeconds}
          listenerCount={live.listenerCount}
          isReconnecting={live.isReconnecting}
          remainingSeconds={remainingSeconds}
          isEnding={isEndBroadcastPending}
          onEnd={end}
        />
      ) : null}

      <StatusDialog
        isOpen={step === "ended"}
        onOpenChange={() => undefined}
        icon={<CheckCircle2Icon aria-hidden className="size-10" />}
        title="Broadcast ended"
        description={endedMessage ?? "Thank you for preaching. Your recording will appear on your profile shortly."}
        actions={
          <>
            <Button asChild>
              <Link href="/profile/edit">Go to your profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      />

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
