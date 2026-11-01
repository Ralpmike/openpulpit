import "server-only";

import { DirectFileOutput, EgressStatus, S3Upload, TrackType, type EgressInfo, type ParticipantInfo } from "livekit-server-sdk";

import { nowIso } from "@/lib/ids";
import { egressClient, liveKitConfig, roomService } from "@/lib/livekit";
import { AUDIO_TRACKS } from "@/modules/broadcasting/audio";

export interface BroadcastForRecording {
  id: string;
  preacher_id: string;
  title: string;
  description: string;
  bible_passage: string;
}

/** recordings/<preacher>/<broadcast>.ogg — private; served only through the audio route. */
export const recordingKey = (preacherId: string, broadcastId: string) => `recordings/${preacherId}/${broadcastId}.ogg`;

export interface RecordingDeps {
  listParticipants: (room: string) => Promise<ParticipantInfo[]>;
  startTrackEgress: (room: string, output: DirectFileOutput, trackSid: string) => Promise<EgressInfo>;
  stopEgress: (egressId: string) => Promise<unknown>;
}

export function liveKitRecordingDeps(env: CloudflareEnv): RecordingDeps {
  const config = liveKitConfig(env);
  const rooms = roomService(config);
  const egress = egressClient(config);
  return {
    listParticipants: (room) => rooms.listParticipants(room),
    startTrackEgress: (room, output, trackSid) => egress.startTrackEgress(room, output, trackSid),
    stopEgress: (egressId) => egress.stopEgress(egressId),
  };
}

/** LiveKit Egress writes straight to R2 through its S3-compatible API. */
export function r2Output(env: CloudflareEnv, key: string): DirectFileOutput {
  return new DirectFileOutput({
    filepath: key,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: env.R2_ACCESS_KEY_ID,
        secret: env.R2_SECRET_ACCESS_KEY,
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        bucket: env.RECORDINGS_BUCKET_NAME,
        forcePathStyle: true,
      }),
    },
  });
}

/**
 * Every broadcast is recorded (requirement 19). Creates the recording row once
 * and starts one egress of the preacher's 32 kbps "speech" track. Safe to call
 * on every go-live, sync and webhook: a claim on egress_id stops a second start.
 */
export async function ensureRecording(
  env: CloudflareEnv,
  broadcast: BroadcastForRecording,
  deps: RecordingDeps = liveKitRecordingDeps(env),
): Promise<"started" | "already" | "waiting" | "failed"> {
  const db = env.DB;
  const key = recordingKey(broadcast.preacher_id, broadcast.id);
  await db
    .prepare(
      `INSERT OR IGNORE INTO recordings (id, broadcast_id, preacher_id, title, description, bible_passage, r2_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), broadcast.id, broadcast.preacher_id, broadcast.title, broadcast.description, broadcast.bible_passage, key)
    .run();

  const claimToken = `pending:${crypto.randomUUID()}`;
  const claim = await db
    .prepare("UPDATE recordings SET egress_id = ? WHERE broadcast_id = ? AND egress_id IS NULL AND status = 'processing'")
    .bind(claimToken, broadcast.id)
    .run();
  if (!claim.meta.changes) return "already";

  const release = () =>
    db.prepare("UPDATE recordings SET egress_id = NULL WHERE broadcast_id = ? AND egress_id = ?").bind(broadcast.id, claimToken).run();
  try {
    const participants = await deps.listParticipants(broadcast.id);
    const preacher = participants.find((participant) => participant.identity === broadcast.preacher_id);
    const track =
      preacher?.tracks.find((t) => t.type === TrackType.AUDIO && t.name === AUDIO_TRACKS.standard) ??
      preacher?.tracks.find((t) => t.type === TrackType.AUDIO);
    if (!track) {
      await release();
      return "waiting"; // the next sync or track_published webhook tries again
    }
    const info = await deps.startTrackEgress(broadcast.id, r2Output(env, key), track.sid);
    await db.prepare("UPDATE recordings SET egress_id = ? WHERE broadcast_id = ? AND egress_id = ?").bind(info.egressId, broadcast.id, claimToken).run();
    return "started";
  } catch (error) {
    console.error("Could not start recording", broadcast.id, error);
    await release();
    return "failed";
  }
}

/** On end: stop the egress so the file is finalised (it also stops when the room closes). */
export async function stopRecording(env: CloudflareEnv, broadcastId: string, deps: RecordingDeps = liveKitRecordingDeps(env)) {
  const row = await env.DB.prepare("SELECT egress_id FROM recordings WHERE broadcast_id = ?").bind(broadcastId).first<{ egress_id: string | null }>();
  if (row?.egress_id && !row.egress_id.startsWith("pending:")) {
    await deps.stopEgress(row.egress_id).catch(() => undefined); // already finished
  }
}

type ReadyListener = (env: CloudflareEnv, recording: { id: string; preacher_id: string }) => Promise<void>;
const readyListeners: ReadyListener[] = [];
export function onRecordingReady(listener: ReadyListener) {
  readyListeners.push(listener);
}

/**
 * egress_ended (webhook): a recording becomes ready only now, with its real
 * duration and size; a failed egress marks it failed and keeps whatever file
 * exists. Only processing rows change, so a retried webhook does nothing.
 */
export async function handleEgressEnded(env: CloudflareEnv, info: Pick<EgressInfo, "egressId" | "status" | "error" | "fileResults">): Promise<void> {
  const db = env.DB;
  const file = info.fileResults?.[0];
  const durationSeconds = file ? Math.round(Number(file.duration) / 1e9) : 0;
  const sizeBytes = file ? Number(file.size) : 0;
  const isUsable =
    info.status === EgressStatus.EGRESS_COMPLETE || (info.status === EgressStatus.EGRESS_LIMIT_REACHED && sizeBytes > 0);
  const recording = await db
    .prepare("SELECT id, preacher_id FROM recordings WHERE egress_id = ? AND status = 'processing'")
    .bind(info.egressId)
    .first<{ id: string; preacher_id: string }>();
  if (!recording) return;
  if (isUsable) {
    await db
      .prepare("UPDATE recordings SET status = 'ready', duration_seconds = ?, size_bytes = ?, ready_at = ? WHERE id = ? AND status = 'processing'")
      .bind(durationSeconds, sizeBytes, nowIso(), recording.id)
      .run();
    for (const listener of readyListeners) await listener(env, recording).catch((error) => console.error(error));
  } else {
    console.error("Recording failed", recording.id, info.status, info.error);
    await db.prepare("UPDATE recordings SET status = 'failed', size_bytes = ? WHERE id = ? AND status = 'processing'").bind(sizeBytes, recording.id).run();
  }
}
