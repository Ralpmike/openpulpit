"use client";

import { MicIcon, MicOffIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import { Button } from "@/components/ui/atoms/button";
import { Field, FieldLabel } from "@/components/ui/atoms/field";
import { Progress } from "@/components/ui/atoms/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select";
import type { UseMicCheckReturn } from "@/modules/broadcasting/hooks/useMicCheck";

export interface MicCheckProps {
  mic: UseMicCheckReturn;
}

/** "Say a few words": a level meter and microphone choice before going live. */
export function MicCheck({ mic }: MicCheckProps) {
  if (mic.permission === "denied") {
    return (
      <Alert variant="destructive" data-testid="mic-denied">
        <MicOffIcon aria-hidden />
        <AlertTitle>Microphone blocked</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          Allow microphone access for this site in your browser settings, then try again.
          <Button variant="outline" size="sm" onClick={() => mic.start()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (mic.permission === "unsupported") {
    return (
      <Alert variant="destructive" data-testid="mic-unsupported">
        <AlertTitle>No microphone found</AlertTitle>
        <AlertDescription>Use a phone or laptop with a microphone, in Chrome, Safari or Firefox.</AlertDescription>
      </Alert>
    );
  }
  if (!mic.isChecking) {
    return (
      <Button size="lg" variant="secondary" onClick={() => mic.start()} data-testid="start-mic-check">
        <MicIcon data-icon="inline-start" aria-hidden />
        Check my microphone
      </Button>
    );
  }
  const percent = Math.round(mic.level * 100);
  return (
    <div className="flex flex-col gap-4" data-testid="mic-check">
      <Field>
        <FieldLabel htmlFor="mic-level">Say a few words</FieldLabel>
        <Progress id="mic-level" value={percent} aria-label="Microphone level" aria-valuetext={mic.hasHeardSound ? "We can hear you" : "Waiting for sound"} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {mic.hasHeardSound ? "We can hear you." : "Waiting for sound…"}
        </p>
      </Field>
      {mic.devices.length > 1 ? (
        <Field>
          <FieldLabel htmlFor="mic-device">Microphone</FieldLabel>
          <Select value={mic.deviceId ?? undefined} onValueChange={(value) => mic.start(value)}>
            <SelectTrigger id="mic-device" className="w-full">
              <SelectValue placeholder="Choose a microphone" />
            </SelectTrigger>
            <SelectContent>
              {mic.devices.map((device, index) => (
                <SelectItem key={device.deviceId || index} value={device.deviceId || `mic-${index}`}>
                  {device.label || `Microphone ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </div>
  );
}
