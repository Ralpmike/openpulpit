/**
 * Lagos time is UTC+1 all year (no daylight saving). Monthly limits use the
 * Lagos calendar month, never the server's time zone or UTC midnight.
 */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** The UTC instant when the Lagos month containing `now` began. */
export function lagosMonthStart(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), 1) - LAGOS_OFFSET_MS);
}

/** The UTC instant when the next Lagos month begins. */
export function nextLagosMonthStart(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() + 1, 1) - LAGOS_OFFSET_MS);
}

/** "2026-11-01" for the Lagos calendar day containing `now`. */
export function lagosDay(now: Date = new Date()): string {
  return new Date(now.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}
