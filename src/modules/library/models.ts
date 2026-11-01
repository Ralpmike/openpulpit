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

/** A recording as its preacher sees it in "Your sermons". */
export interface MyRecording {
  id: string;
  title: string;
  description: string;
  biblePassage: string;
  status: RecordingStatus;
  visibility: RecordingVisibility;
  durationSeconds: number;
  createdAt: string;
  replayCount: number;
  peakListeners: number;
}
