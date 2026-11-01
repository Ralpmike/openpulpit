import type { BroadcastStatus, EndedReason } from "@/modules/broadcasting/server/policy";

export type { BroadcastStatus, EndedReason };

export interface Broadcast {
  id: string;
  preacherId: string;
  title: string;
  description: string;
  biblePassage: string;
  status: BroadcastStatus;
  endedReason: EndedReason | "";
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  peakListeners: number;
  currentListeners: number;
}

export interface HoursSummary {
  capSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  /** When the hours renew: the next Lagos month. */
  renewsAt: string;
}

export interface PublishGrant {
  token: string;
  url: string;
  broadcastId: string;
}

export interface ListenGrant {
  token: string;
  url: string;
  broadcastId: string;
}

export interface PreacherSummary {
  name: string;
  slug: string;
  photoUrl: string | null;
  isVerified: boolean;
}

/** What listeners see about a broadcast. */
export interface PublicBroadcast {
  id: string;
  title: string;
  description: string;
  biblePassage: string;
  status: BroadcastStatus;
  startedAt: string | null;
  endedAt: string | null;
  listenerCount: number;
  preacher: PreacherSummary;
}

export interface SyncResponse {
  broadcast: Broadcast;
  remainingSeconds: number;
  isHoursWarning: boolean;
}
