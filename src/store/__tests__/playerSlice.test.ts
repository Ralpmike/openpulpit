import { describe, expect, it } from "vitest";

import { makeStore } from "@/store";
import { pause, play, resume, setSpeed, stop, type NowPlaying } from "@/store/playerSlice";

const replay: NowPlaying = {
  kind: "replay",
  id: "rec-1",
  title: "Walking in Faith",
  preacherName: "Pastor Adebayo Ogunleye",
  preacherSlug: "adebayo-ogunleye",
};
const live: NowPlaying = { ...replay, kind: "live", id: "bc-1", title: "Sunday Service" };

describe("playerSlice", () => {
  it("plays, pauses, resumes and stops", () => {
    const store = makeStore();
    store.dispatch(play(replay));
    expect(store.getState().player).toMatchObject({ nowPlaying: replay, isPlaying: true });
    store.dispatch(pause());
    expect(store.getState().player.isPlaying).toBe(false);
    store.dispatch(resume());
    expect(store.getState().player.isPlaying).toBe(true);
    store.dispatch(stop());
    expect(store.getState().player).toMatchObject({ nowPlaying: null, isPlaying: false });
  });

  it("changes speed for replays but keeps live audio at 1x", () => {
    const store = makeStore();
    store.dispatch(play(replay));
    store.dispatch(setSpeed(2));
    expect(store.getState().player.speed).toBe(2);
    store.dispatch(play(live));
    expect(store.getState().player.speed).toBe(1);
    store.dispatch(setSpeed(1.5));
    expect(store.getState().player.speed).toBe(1);
  });

  it("does not resume when nothing is loaded", () => {
    const store = makeStore();
    store.dispatch(resume());
    expect(store.getState().player.isPlaying).toBe(false);
  });
});
