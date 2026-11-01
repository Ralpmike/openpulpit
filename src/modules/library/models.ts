import type { PreacherSummary } from "@/modules/broadcasting/models";

export type RecordingStatus = "processing" | "ready" | "failed" | "deleted";
export type RecordingVisibility = "public" | "hidden_by_preacher" | "hidden_by_admin";

/** A recording as listeners see it. */
export interface PublicRecording {
  id: string;
  title: string;
  description: string;
  biblePassage: string;
  durationSeconds: number;
  bitrateKbps: number;
  createdAt: string;
  preacher: PreacherSummary;
}
