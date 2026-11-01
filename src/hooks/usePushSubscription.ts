"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "@/helpers/api/baseQuery";

export type PushStatus = "loading" | "unsupported" | "denied" | "off" | "on";

export type UsePushSubscriptionReturn = {
  status: PushStatus;
  isBusy: boolean;
  errorMessage: string | null;
  turnOn: () => Promise<void>;
  turnOff: () => Promise<void>;
};

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** This browser's go-live notifications: ask permission, subscribe, and tell the server (requirement 17). */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!isCancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!isCancelled) setStatus("denied");
        return;
      }
      const existing = await (await registration()).pushManager.getSubscription();
      if (!isCancelled) setStatus(existing ? "on" : "off");
    })().catch(() => !isCancelled && setStatus("unsupported"));
    return () => {
      isCancelled = true;
    };
  }, []);

  const turnOn = useCallback(async () => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const config = (await (await fetch(`${API_BASE_URL}/push/config`)).json()) as { data: { publicKey: string | null } };
      if (!config.data.publicKey) throw new Error("Notifications aren't set up yet.");
      const subscription = await (await registration()).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.data.publicKey),
      });
      const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("Couldn't save your notification settings.");
      setStatus("on");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't turn on notifications.");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const turnOff = useCallback(async () => {
    setIsBusy(true);
    try {
      const subscription = await (await registration()).pushManager.getSubscription();
      if (subscription) {
        await fetch(`${API_BASE_URL}/push/subscriptions`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { status, isBusy, errorMessage, turnOn, turnOff };
}
