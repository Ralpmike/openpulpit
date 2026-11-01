import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PlaybackSpeed = 1 | 1.5 | 2;

/** What the persistent player is playing. Plain, serialisable data only. */
export interface NowPlaying {
  kind: "live" | "replay";
  /** Broadcast id for live, recording id for replay. */
  id: string;
  title: string;
  preacherName: string;
  preacherSlug: string;
  artworkUrl?: string;
}

export interface PlayerState {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  /** "Higher quality on Wi-Fi" (requirement 13). Off by default; remembered on this device. */
  prefersHighQuality: boolean;
}

const initialState: PlayerState = {
  nowPlaying: null,
  isPlaying: false,
  speed: 1,
  prefersHighQuality: false,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    play(state, action: PayloadAction<NowPlaying>) {
      const isSameItem =
        state.nowPlaying?.id === action.payload.id && state.nowPlaying.kind === action.payload.kind;
      state.nowPlaying = action.payload;
      state.isPlaying = true;
      // Live audio always plays at 1x; replays keep the listener's speed.
      if (action.payload.kind === "live" || !isSameItem) state.speed = action.payload.kind === "live" ? 1 : state.speed;
    },
    pause(state) {
      state.isPlaying = false;
    },
    resume(state) {
      if (state.nowPlaying) state.isPlaying = true;
    },
    stop(state) {
      state.nowPlaying = null;
      state.isPlaying = false;
    },
    setPrefersHighQuality(state, action: PayloadAction<boolean>) {
      state.prefersHighQuality = action.payload;
    },
    setSpeed(state, action: PayloadAction<PlaybackSpeed>) {
      if (state.nowPlaying?.kind !== "live") state.speed = action.payload;
    },
  },
});

export const { play, pause, resume, stop, setSpeed, setPrefersHighQuality } = playerSlice.actions;
