import { FileInfo } from "@livekit/protocol";
import { EgressInfo, EgressStatus, TrackType } from "livekit-server-sdk";
import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: vi.fn() }));

import { ensureRecording, handleEgressEnded, onRecordingReady, stopRecording, type RecordingDeps } from "@/modules/library/server/recording";
import { createTestEnv } from "@/test/env";
import { seedPreacher } from "@/test/seed";

const broadcast = { id: "b1", preacher_id: "p1", title: "Sunday Service", description: "", bible_passage: "John 3:16" };

function setup() {
  const env = createTestEnv({
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    RECORDINGS_BUCKET_NAME: "openpulpit-recordings-test",
  } as Partial<CloudflareEnv>);
  seedPreacher(env.DB, "p1");
  env.DB.sqlite.prepare("INSERT INTO broadcasts (id, preacher_id, title, status, started_at) VALUES ('b1', 'p1', 'Sunday Service', 'live', '2026-11-01T09:00:00Z')").run();
  return env;
}

function deps(tracks: { sid: string; name: string }[] = [{ sid: "TR_speech", name: "speech" }, { sid: "TR_hq", name: "speech-hq" }]): RecordingDeps & {
  startTrackEgress: ReturnType<typeof vi.fn>;
  stopEgress: ReturnType<typeof vi.fn>;
} {
  return {
    listParticipants: vi.fn(async () => [{ identity: "p1", tracks: tracks.map((t) => ({ ...t, type: TrackType.AUDIO })) }] as never),
    startTrackEgress: vi.fn(async () => new EgressInfo({ egressId: "EG_1" })),
    stopEgress: vi.fn(async () => ({})),
  };
}

const row = (env: ReturnType<typeof setup>) =>
  env.DB.sqlite.prepare("SELECT status, egress_id, r2_key, duration_seconds, size_bytes, bible_passage FROM recordings WHERE broadcast_id = 'b1'").get();

describe("recording broadcasts", () => {
  it("records the 32 kbps speech track to R2, once per broadcast", async () => {
    const env = setup();
    const d = deps();
    expect(await ensureRecording(env, broadcast, d)).toBe("started");
    expect(await ensureRecording(env, broadcast, d)).toBe("already");
    expect(d.startTrackEgress).toHaveBeenCalledOnce();
    const [room, output, trackSid] = d.startTrackEgress.mock.calls[0]!;
    expect([room, trackSid]).toEqual(["b1", "TR_speech"]);
    expect(output.filepath).toBe("recordings/p1/b1.ogg");
    expect(output.output.value).toMatchObject({
      bucket: "openpulpit-recordings-test",
      endpoint: "https://acct.r2.cloudflarestorage.com",
      region: "auto",
      forcePathStyle: true,
    });
    expect(row(env)).toMatchObject({ status: "processing", egress_id: "EG_1", bible_passage: "John 3:16" });
  });

  it("waits for the preacher's track, and retries after a failed start", async () => {
    const env = setup();
    expect(await ensureRecording(env, broadcast, deps([]))).toBe("waiting");
    const failing = deps();
    failing.startTrackEgress.mockRejectedValueOnce(new Error("egress busy"));
    expect(await ensureRecording(env, broadcast, failing)).toBe("failed");
    expect(row(env)).toMatchObject({ egress_id: null });
    expect(await ensureRecording(env, broadcast, deps())).toBe("started");
  });

  it("becomes ready only when egress ends complete, with duration and size; repeat-safe", async () => {
    const env = setup();
    await ensureRecording(env, broadcast, deps());
    const ready = vi.fn(async () => {});
    onRecordingReady(ready);
    const info = new EgressInfo({
      egressId: "EG_1",
      status: EgressStatus.EGRESS_COMPLETE,
      fileResults: [new FileInfo({ duration: BigInt(3_900) * BigInt(1e9), size: BigInt(15_600_000) })],
    });
    await handleEgressEnded(env, info);
    await handleEgressEnded(env, info);
    expect(row(env)).toMatchObject({ status: "ready", duration_seconds: 3900, size_bytes: 15_600_000 });
    expect(ready).toHaveBeenCalledOnce();
  });

  it("marks a failed egress as failed, keeping the row", async () => {
    const env = setup();
    await ensureRecording(env, broadcast, deps());
    await handleEgressEnded(env, new EgressInfo({ egressId: "EG_1", status: EgressStatus.EGRESS_FAILED, error: "upload failed" }));
    expect(row(env)).toMatchObject({ status: "failed", r2_key: "recordings/p1/b1.ogg" });
  });

  it("stops the egress when the broadcast ends", async () => {
    const env = setup();
    const d = deps();
    await ensureRecording(env, broadcast, d);
    await stopRecording(env, "b1", d);
    expect(d.stopEgress).toHaveBeenCalledWith("EG_1");
  });
});
