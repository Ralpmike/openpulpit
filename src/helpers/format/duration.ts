/** 754 → "12:34"; 3723 → "1:02:03" (a live clock). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(hours ? 2 : 1, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 3900 → "1 h 5 min"; 600 → "10 min"; 30 → "less than a minute". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutes < 1) return "less than a minute";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Screen-reader friendly: 3723 → "1 hour 2 minutes". */
export function spokenDuration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (rest || !hours) parts.push(`${rest} minute${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}
