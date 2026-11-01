/**
 * Audio settings for going live (broadcasting-rules: data budget).
 * Opus, mono, ~32 kbps: about 14.4 MB an hour for each listener.
 */
export const PUBLISH_BITRATE_BPS = 32_000;

export const MIC_CAPTURE_OPTIONS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
} as const;

export const MIC_PUBLISH_OPTIONS = {
  name: "speech",
  audioPreset: { maxBitrate: PUBLISH_BITRATE_BPS },
  // Silence costs almost nothing.
  dtx: true,
  // Redundant audio roughly doubles bandwidth; off until measured.
  red: false,
  forceStereo: false,
} as const;

/** Track names listeners choose between (requirement 13). */
export const AUDIO_TRACKS = { standard: "speech", high: "speech-hq" } as const;
export const HIGH_QUALITY_BITRATE_BPS = 64_000;

/** The optional second track, sent only when the preacher is on Wi-Fi. */
export const HQ_PUBLISH_OPTIONS = {
  name: AUDIO_TRACKS.high,
  audioPreset: { maxBitrate: HIGH_QUALITY_BITRATE_BPS },
  dtx: true,
  red: false,
  forceStereo: false,
} as const;

type NetworkInformationLike = { type?: string; effectiveType?: string; saveData?: boolean };

/**
 * Whether this device is on Wi-Fi (or a wired/unknown fast link). Uses the
 * Network Information API where it exists; Safari doesn't expose it, so
 * "unknown" there counts as not Wi-Fi to protect mobile data.
 */
export function isOnWifi(connection: NetworkInformationLike | undefined = typeof navigator !== "undefined"
  ? (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  : undefined): boolean {
  if (!connection || connection.saveData) return false;
  return connection.type === "wifi" || connection.type === "ethernet";
}

/** Which track a listener should hear. High quality only when asked for, available and on Wi-Fi. */
export function chooseListenerTrack(input: { prefersHighQuality: boolean; isOnWifi: boolean; availableTracks: string[] }): string | null {
  const wantsHigh = input.prefersHighQuality && input.isOnWifi && input.availableTracks.includes(AUDIO_TRACKS.high);
  if (wantsHigh) return AUDIO_TRACKS.high;
  if (input.availableTracks.includes(AUDIO_TRACKS.standard)) return AUDIO_TRACKS.standard;
  return input.availableTracks[0] ?? null;
}
