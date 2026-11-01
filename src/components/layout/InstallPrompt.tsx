"use client";

import { DownloadIcon, ShareIcon, XIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/atoms/button";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { dismissInstallPrompt, setInstallPromptDismissed } from "@/store/uiSlice";

const DISMISSED_KEY = "openpulpit.installDismissed";

/** A small, dismissible banner to add OpenPulpit to the home screen (requirement 30). */
export function InstallPrompt() {
  const dispatch = useAppDispatch();
  const isDismissed = useAppSelector((state) => state.ui.isInstallPromptDismissed);
  const { platform, install } = useInstallPrompt();

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) dispatch(setInstallPromptDismissed(true));
    } catch {
      // ignore
    }
  }, [dispatch]);

  if (isDismissed || (platform !== "prompt" && platform !== "ios")) return null;

  function dismiss() {
    dispatch(dismissInstallPrompt());
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <aside aria-label="Install OpenPulpit" className="flex items-center gap-3 rounded-lg border bg-secondary p-3 text-secondary-foreground" data-testid="install-prompt">
      <p className="flex-1 text-sm">
        {platform === "ios" ? (
          <>
            Add OpenPulpit to your Home Screen: tap <ShareIcon aria-label="Share" className="inline size-4" /> then &ldquo;Add to Home Screen&rdquo;.
          </>
        ) : (
          "Install OpenPulpit for quick access, like an app."
        )}
      </p>
      {platform === "prompt" ? (
        <Button size="sm" onClick={install} data-testid="install-button">
          <DownloadIcon data-icon="inline-start" aria-hidden />
          Install
        </Button>
      ) : null}
      <Button size="icon-sm" variant="ghost" onClick={dismiss} aria-label="Not now">
        <XIcon aria-hidden />
      </Button>
    </aside>
  );
}
