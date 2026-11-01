"use client";

import { CopyIcon, MessageCircleIcon, Share2Icon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";

export interface ShareButtonsProps {
  /** Path on this site, e.g. /r/123 */
  path: string;
  /** "Walking in Faith by Pastor Ade" */
  text: string;
}

const subscribe = () => () => undefined;
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** WhatsApp first (how most people share in Nigeria), then the phone's share sheet, then copy (requirement 23). */
export function ShareButtons({ path, text }: ShareButtonsProps) {
  const hasNativeShare = useSyncExternalStore(subscribe, canNativeShare, () => false);
  const url = () => new URL(path, window.location.origin).toString();

  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="share-buttons">
      <Button
        variant="outline"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url()}`)}`, "_blank", "noopener")}
        data-testid="share-whatsapp"
      >
        <MessageCircleIcon data-icon="inline-start" aria-hidden />
        WhatsApp
      </Button>
      {hasNativeShare ? (
        <Button
          variant="outline"
          onClick={() => navigator.share({ title: text, text, url: url() }).catch(() => undefined)}
          data-testid="share-native"
        >
          <Share2Icon data-icon="inline-start" aria-hidden />
          Share
        </Button>
      ) : null}
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            toast.success("Link copied");
          } catch {
            toast.error("Couldn't copy. Long-press the address bar to copy the link.");
          }
        }}
        data-testid="share-copy"
      >
        <CopyIcon data-icon="inline-start" aria-hidden />
        Copy link
      </Button>
    </div>
  );
}
