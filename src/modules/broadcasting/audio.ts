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
  audioPreset: { maxBitrate: PUBLISH_BITRATE_BPS },
  // Silence costs almost nothing.
  dtx: true,
  // Redundant audio roughly doubles bandwidth; off until measured.
  red: false,
  forceStereo: false,
} as const;
