export const newId = () => crypto.randomUUID();

/** ISO-8601 UTC timestamp, the format every table uses. */
export const nowIso = (now: Date = new Date()) => now.toISOString();
