"use client";

import { BellIcon, BellOffIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/atoms/alert";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { usePushSubscription } from "@/hooks/usePushSubscription";

/** Turn go-live notifications on or off for this phone or browser. */
export function NotificationSettings() {
  const push = usePushSubscription();
  if (push.status === "loading") return null;
  if (push.status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground" data-testid="push-unsupported">
        This browser can&apos;t show notifications. On iPhone, add OpenPulpit to your Home Screen first, then open it from there.
      </p>
    );
  }
  if (push.status === "denied") {
    return (
      <Alert data-testid="push-denied">
        <BellOffIcon aria-hidden />
        <AlertTitle>Notifications are blocked</AlertTitle>
        <AlertDescription>Allow notifications for this site in your browser settings to hear when preachers go live.</AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4" data-testid="notification-settings">
      <p className="flex items-center gap-2 font-medium">
        {push.status === "on" ? <BellIcon aria-hidden className="size-4" /> : <BellOffIcon aria-hidden className="size-4" />}
        {push.status === "on" ? "Go-live notifications are on" : "Get told when they go live"}
      </p>
      <p className="text-sm text-muted-foreground">
        {push.status === "on"
          ? "This phone gets a notification when a preacher you follow goes live."
          : "We'll send one notification when a preacher you follow goes live. Nothing else."}
      </p>
      {push.errorMessage ? <p className="text-sm text-destructive">{push.errorMessage}</p> : null}
      <LoaderButton
        variant={push.status === "on" ? "outline" : "default"}
        isLoading={push.isBusy}
        onClick={push.status === "on" ? push.turnOff : push.turnOn}
        className="self-start"
        data-testid="push-toggle"
      >
        {push.status === "on" ? "Turn off on this phone" : "Turn on notifications"}
      </LoaderButton>
    </div>
  );
}
