// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const playerContext = { audioRef: { current: null }, liveState: "playing", liveErrorMessage: null, unblockAudio: vi.fn() };
vi.mock("@/modules/player/PlayerProvider", () => ({ usePlayer: () => playerContext }));

import { setMediaSession } from "@/modules/player/mediaSession";
import { ListenButton } from "@/modules/player/ListenButton";
import { PlayerBar } from "@/modules/player/PlayerBar";
import type { NowPlaying } from "@/store/playerSlice";
import { renderWithStore } from "@/test/renderWithStore";

const live: NowPlaying = { kind: "live", id: "b1", title: "Sunday Service", preacherName: "Pastor Ade", preacherSlug: "ade" };

describe("PlayerBar", () => {
  afterEach(() => {
    playerContext.liveState = "playing";
  });

  it("is hidden until something plays, then shows what is live with labelled controls", async () => {
    const { store } = renderWithStore(<PlayerBar />);
    expect(screen.queryByTestId("player-bar")).toBeNull();
    renderWithStore(<ListenButton item={live} />, { store });
    await userEvent.click(screen.getByTestId("listen-button"));
    expect(screen.getByRole("region", { name: "Now playing" })).toHaveTextContent("Sunday Service");
    expect(screen.getByTestId("live-badge")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("player-toggle"));
    expect(store.getState().player.isPlaying).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Close player" }));
    expect(store.getState().player.nowPlaying).toBeNull();
  });

  it("says when it is reconnecting, and offers a tap when the browser blocks audio", () => {
    playerContext.liveState = "reconnecting";
    renderWithStore(<PlayerBar />, { preloadedState: { player: { nowPlaying: live, isPlaying: true, speed: 1, prefersHighQuality: false } } });
    expect(screen.getByTestId("player-bar")).toHaveTextContent("Reconnecting…");
    playerContext.liveState = "blocked";
    renderWithStore(<PlayerBar />, { preloadedState: { player: { nowPlaying: live, isPlaying: true, speed: 1, prefersHighQuality: false } } });
    expect(screen.getByRole("button", { name: "Start audio" })).toBeInTheDocument();
  });
});

describe("Media Session", () => {
  it("puts the preacher and title on the lock screen with play, pause and stop", () => {
    const handlers = new Map<string, unknown>();
    class FakeMetadata {
      constructor(readonly init: MediaMetadataInit) {}
    }
    vi.stubGlobal("MediaMetadata", FakeMetadata);
    Object.defineProperty(navigator, "mediaSession", {
      configurable: true,
      value: { metadata: null, playbackState: "none", setActionHandler: (action: string, handler: unknown) => handlers.set(action, handler) },
    });
    setMediaSession(live, { onPlay: vi.fn(), onPause: vi.fn(), onStop: vi.fn() });
    expect((navigator.mediaSession.metadata as unknown as FakeMetadata).init).toMatchObject({
      title: "Sunday Service",
      artist: "Pastor Ade",
      album: "Live on OpenPulpit",
    });
    expect([...handlers.keys()]).toEqual(["play", "pause", "stop"]);
    vi.unstubAllGlobals();
  });
});
