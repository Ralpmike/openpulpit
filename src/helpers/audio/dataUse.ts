/** The default live and replay bitrate (Opus, mono): about 14.4 MB an hour. */
export const DEFAULT_AUDIO_KBPS = 32;

/** Megabytes used by an hour of audio at `kbps`: kbps × 3600 / 8 / 1000. */
export function mbPerHour(kbps: number): number {
  return (kbps * 3600) / 8 / 1000;
}

/** "About 15 MB per hour" — rounded and labelled as an estimate (requirement 14). */
export function dataUseLabel(kbps: number = DEFAULT_AUDIO_KBPS): string {
  const mb = mbPerHour(kbps);
  const rounded = mb < 20 ? Math.round(mb) : Math.round(mb / 5) * 5;
  return `About ${rounded} MB per hour`;
}

/** "About 9 MB" for a whole recording, from its length and bitrate. */
export function recordingDataLabel(durationSeconds: number, kbps: number = DEFAULT_AUDIO_KBPS): string {
  const mb = (kbps * durationSeconds) / 8 / 1000;
  if (mb < 1) return "Less than 1 MB";
  return `About ${mb < 20 ? Math.round(mb) : Math.round(mb / 5) * 5} MB`;
}
