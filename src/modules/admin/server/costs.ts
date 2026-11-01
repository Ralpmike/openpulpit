import "server-only";

import { lagosDay } from "@/helpers/time/lagos";
import { sendEmail } from "@/modules/accounts/server/email";

export type CostMetric = "bandwidth" | "livekit_minutes" | "failed_recordings";

export interface CostCheck {
  metric: CostMetric;
  value: number;
  threshold: number;
  isOver: boolean;
}

export interface CostThresholds {
  bandwidthGb: number;
  livekitMinutes: number;
}

export function costThresholds(env: CloudflareEnv): CostThresholds {
  const read = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    bandwidthGb: read(env.COST_ALERT_DAILY_BANDWIDTH_GB, 20),
    livekitMinutes: read(env.COST_ALERT_DAILY_LIVEKIT_MINUTES, 20_000),
  };
}

/**
 * Today's (Lagos) usage against the limits. LiveKit bills connection minutes:
 * listener-minutes plus the preacher's own minutes. Any failed recording alerts.
 */
export async function checkCosts(db: D1Database, thresholds: CostThresholds, now: Date = new Date()): Promise<CostCheck[]> {
  const day = lagosDay(now);
  const row = await db
    .prepare(
      `SELECT coalesce((SELECT bandwidth_bytes FROM daily_stats WHERE day = ?1), 0) AS bandwidth_bytes,
              coalesce((SELECT listen_seconds + broadcast_seconds FROM daily_stats WHERE day = ?1), 0) AS connection_seconds,
              (SELECT count(*) FROM recordings WHERE status = 'failed' AND created_at >= ?2) AS failed_recordings`,
    )
    .bind(day, new Date(now.getTime() - 24 * 3600_000).toISOString())
    .first<{ bandwidth_bytes: number; connection_seconds: number; failed_recordings: number }>();
  const bandwidthGb = (row?.bandwidth_bytes ?? 0) / 1e9;
  const livekitMinutes = (row?.connection_seconds ?? 0) / 60;
  const failed = row?.failed_recordings ?? 0;
  return [
    { metric: "bandwidth", value: bandwidthGb, threshold: thresholds.bandwidthGb, isOver: bandwidthGb >= thresholds.bandwidthGb },
    { metric: "livekit_minutes", value: livekitMinutes, threshold: thresholds.livekitMinutes, isOver: livekitMinutes >= thresholds.livekitMinutes },
    { metric: "failed_recordings", value: failed, threshold: 1, isOver: failed >= 1 },
  ];
}

const LABELS: Record<CostMetric, (check: CostCheck) => string> = {
  bandwidth: (c) => `Bandwidth today: ${c.value.toFixed(1)} GB (alert at ${c.threshold} GB)`,
  livekit_minutes: (c) => `LiveKit minutes today: ${Math.round(c.value).toLocaleString("en")} (alert at ${c.threshold.toLocaleString("en")})`,
  failed_recordings: (c) => `${c.value} recording(s) failed in the last 24 hours. Check LiveKit Egress and the R2 credentials.`,
};

/** Emails each alert at most once per Lagos day (claimed in cost_alerts first). */
export async function sendCostAlerts(env: CloudflareEnv, checks: CostCheck[], now: Date = new Date()): Promise<CostMetric[]> {
  const day = lagosDay(now);
  const sent: CostMetric[] = [];
  for (const check of checks.filter((c) => c.isOver)) {
    const claim = await env.DB.prepare("INSERT OR IGNORE INTO cost_alerts (day, metric, value, threshold) VALUES (?, ?, ?, ?)")
      .bind(day, check.metric, check.value, check.threshold)
      .run();
    if (!claim.meta.changes) continue;
    const text = LABELS[check.metric](check);
    console.error(`[cost alert] ${text}`);
    if (env.ALERT_EMAIL) {
      await sendEmail(
        { to: env.ALERT_EMAIL, subject: `OpenPulpit alert (${env.APP_ENV}): ${check.metric.replace("_", " ")}`, text, html: `<p>${text}</p>` },
        { apiKey: env.EMAIL_API_KEY, from: env.EMAIL_FROM, appEnv: env.APP_ENV },
      ).catch((error) => console.error("Alert email failed", error));
    }
    sent.push(check.metric);
  }
  return sent;
}
