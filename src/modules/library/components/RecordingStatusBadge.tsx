import { Badge } from "@/components/ui/atoms/badge";
import type { MyRecording } from "@/modules/library/models";

/** Status in words (never colour alone). */
export function RecordingStatusBadge({ recording }: { recording: Pick<MyRecording, "status" | "visibility"> }) {
  if (recording.status === "processing") return <Badge variant="warning">Saving…</Badge>;
  if (recording.status === "failed") return <Badge variant="destructive">Recording failed</Badge>;
  if (recording.visibility === "hidden_by_admin") return <Badge variant="destructive">Hidden by OpenPulpit</Badge>;
  if (recording.visibility === "hidden_by_preacher") return <Badge variant="secondary">Hidden</Badge>;
  return <Badge variant="good">Public</Badge>;
}
