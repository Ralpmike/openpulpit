"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "prompt" | "ios" | "installed" | "unsupported";

export type UseInstallPromptReturn = {
  platform: InstallPlatform;
  install: () => Promise<void>;
};

/** Android/desktop get the browser's install prompt; iPhone gets "Add to Home Screen" steps. */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>("unsupported");

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the platform once on mount
    setPlatform(isStandalone ? "installed" : isIos ? "ios" : "unsupported");
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setPlatform("prompt");
    };
    const onInstalled = () => setPlatform("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setPlatform(choice.outcome === "accepted" ? "installed" : "unsupported");
  }, [deferred]);

  return { platform, install };
}
