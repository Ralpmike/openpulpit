const LAGOS = "Africa/Lagos";

/** "1 December" in Lagos time. */
export function formatDayMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", timeZone: LAGOS }).format(new Date(iso));
}

/** "25 Oct 2026" in Lagos time. */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: LAGOS }).format(new Date(iso));
}

/** "2 hours ago", "3 days ago", "just now". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (seconds >= size) return format.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}
