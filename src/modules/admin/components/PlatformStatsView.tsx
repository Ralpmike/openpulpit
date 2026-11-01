"use client";

import { Badge } from "@/components/ui/atoms/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/atoms/table";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { useGetPlatformStatsQuery } from "@/modules/admin/store/endpoints";

const number = new Intl.NumberFormat("en-NG");

/** Requirement 28: preachers, listeners, broadcasts, hours streamed and total bandwidth. */
export function PlatformStatsView() {
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useGetPlatformStatsQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  if (isStatsLoading) return <SectionLoadingSkeleton rows={3} hasAvatar={false} label="Loading stats" />;
  if (isStatsError || !stats) return <p className="text-sm text-destructive">Stats didn&apos;t load.</p>;
  const tiles = [
    { label: "Preachers", value: number.format(stats.preachers) },
    { label: "Listeners (accounts)", value: number.format(stats.listeners) },
    { label: "Broadcasts", value: number.format(stats.broadcasts), note: `${stats.liveNow} live now` },
    { label: "Hours streamed", value: number.format(stats.hoursStreamed) },
    { label: "Hours listened", value: number.format(stats.listenHours) },
    { label: "Bandwidth (estimate)", value: `${number.format(stats.bandwidthGb)} GB`, note: "Live at 32 kbps + replay bytes served" },
  ];
  return (
    <div className="flex flex-col gap-6" data-testid="platform-stats">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>
                <dt>{tile.label}</dt>
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                <dd>{tile.value}</dd>
              </CardTitle>
            </CardHeader>
            {tile.note ? <CardContent className="px-4 text-xs text-muted-foreground">{tile.note}</CardContent> : null}
          </Card>
        ))}
      </dl>
      {stats.costs ? (
        <section aria-labelledby="costs-heading" className="flex flex-col gap-2" data-testid="cost-checks">
          <h2 id="costs-heading" className="text-lg font-semibold">Today against alert limits</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {stats.costs.map((check) => (
              <li key={check.metric} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <span>{{ bandwidth: "Bandwidth (GB)", livekit_minutes: "LiveKit minutes", failed_recordings: "Failed recordings (24 h)" }[check.metric]}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {number.format(Math.round(check.value * 10) / 10)} / {number.format(check.threshold)}
                  <Badge variant={check.isOver ? "destructive" : "good"}>{check.isOver ? "Over" : "OK"}</Badge>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Alerts go to ALERT_EMAIL once a day per metric. Limits are set in wrangler.jsonc.</p>
        </section>
      ) : null}
      <section aria-labelledby="daily-heading" className="flex flex-col gap-2">
        <h2 id="daily-heading" className="text-lg font-semibold">Last 14 days (Lagos time)</h2>
        {stats.days.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Broadcast hours</TableHead>
                  <TableHead className="text-right">Listen hours</TableHead>
                  <TableHead className="text-right">Bandwidth (GB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.days.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell className="tabular-nums">{day.day}</TableCell>
                    <TableCell className="text-right tabular-nums">{day.broadcastHours}</TableCell>
                    <TableCell className="text-right tabular-nums">{day.listenHours}</TableCell>
                    <TableCell className="text-right tabular-nums">{day.bandwidthGb}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        )}
      </section>
    </div>
  );
}
