import type { NowPlaying } from "@/store/playerSlice";

/** Lock-screen and notification info (requirement 12). No-op where unsupported. */
export function setMediaSession(
  nowPlaying: NowPlaying | null,
  handlers: { onPlay: () => void; onPause: () => void; onStop: () => void },
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const session = navigator.mediaSession;
  if (!nowPlaying) {
    session.metadata = null;
    session.playbackState = "none";
    return;
  }
  session.metadata = new MediaMetadata({
    title: nowPlaying.title,
    artist: nowPlaying.preacherName,
    album: nowPlaying.kind === "live" ? "Live on OpenPulpit" : "OpenPulpit",
    artwork: nowPlaying.artworkUrl ? [{ src: nowPlaying.artworkUrl, sizes: "512x512", type: "image/webp" }] : [],
  });
  const set = (action: MediaSessionAction, handler: (() => void) | null) => {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // Not every browser supports every action.
    }
  };
  set("play", handlers.onPlay);
  set("pause", handlers.onPause);
  set("stop", handlers.onStop);
}

export function setMediaPlaybackState(state: "playing" | "paused" | "none"): void {
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) navigator.mediaSession.playbackState = state;
}
