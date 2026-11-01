import { describe, expect, it } from "vitest";

import { AUDIO_TRACKS, chooseListenerTrack, isOnWifi, MIC_PUBLISH_OPTIONS } from "@/modules/broadcasting/audio";

const both = [AUDIO_TRACKS.standard, AUDIO_TRACKS.high];

describe("audio quality", () => {
  it("publishes the default track at 32 kbps with DTX and no RED", () => {
    expect(MIC_PUBLISH_OPTIONS).toMatchObject({ name: "speech", audioPreset: { maxBitrate: 32_000 }, dtx: true, red: false });
  });

  it("gives everyone the 32 kbps track unless they asked for more and are on Wi-Fi", () => {
    expect(chooseListenerTrack({ prefersHighQuality: false, isOnWifi: true, availableTracks: both })).toBe("speech");
    expect(chooseListenerTrack({ prefersHighQuality: true, isOnWifi: false, availableTracks: both })).toBe("speech");
    expect(chooseListenerTrack({ prefersHighQuality: true, isOnWifi: true, availableTracks: both })).toBe("speech-hq");
    expect(chooseListenerTrack({ prefersHighQuality: true, isOnWifi: true, availableTracks: ["speech"] })).toBe("speech");
    expect(chooseListenerTrack({ prefersHighQuality: false, isOnWifi: false, availableTracks: [] })).toBeNull();
  });

  it("treats only Wi-Fi or wired as Wi-Fi, and respects data saver", () => {
    expect(isOnWifi({ type: "wifi" })).toBe(true);
    expect(isOnWifi({ type: "cellular", effectiveType: "4g" })).toBe(false);
    expect(isOnWifi({ type: "wifi", saveData: true })).toBe(false);
    expect(isOnWifi(undefined)).toBe(false);
  });
});
