export interface ReportGroup {
  targetType: "broadcast" | "recording" | "profile";
  targetId: string;
  reportCount: number;
  reasons: string[];
  latestDetails: string;
  latestAt: string;
  /** What admins see: title, preacher and state of the reported thing. */
  title: string;
  preacherId: string | null;
  preacherName: string;
  preacherStatus: string;
  state: string;
  link: string | null;
}

export interface AuditRow {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}


export interface PlatformStats {
  preachers: number;
  listeners: number;
  broadcasts: number;
  liveNow: number;
  hoursStreamed: number;
  listenHours: number;
  bandwidthGb: number;
  days: { day: string; broadcastHours: number; listenHours: number; bandwidthGb: number }[];
}

