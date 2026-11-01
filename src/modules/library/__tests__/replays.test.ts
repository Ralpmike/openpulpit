import { describe, expect, it } from "vitest";

import { CURRENT_TERMS_VERSION, type Viewer } from "@/modules/accounts";
import { listMyRecordings } from "@/modules/library/server/manage";
import { countReplay } from "@/modules/library/server/playback";
import { createTestD1 } from "@/test/d1";
import { seedPreacher, seedRecording } from "@/test/seed";

const preacher: Viewer = { id: "p1", name: "Ade", email: "p@x.ng", image: null, role: "preacher", status: "active", termsVersion: CURRENT_TERMS_VERSION };

describe("preacher stats per broadcast", () => {
  it("counts a replay once per listener per day, and shows peak live listeners", async () => {
    const db = createTestD1();
    seedPreacher(db, "p1");
    seedRecording(db, "r1", "p1");
    db.sqlite.prepare("UPDATE broadcasts SET peak_listeners = 214 WHERE id = 'b-r1'").run();
    expect(await countReplay(db, { recordingId: "r1", listenerKey: "u:l1", day: "2026-11-01" })).toBe(true);
    expect(await countReplay(db, { recordingId: "r1", listenerKey: "u:l1", day: "2026-11-01" })).toBe(false);
    expect(await countReplay(db, { recordingId: "r1", listenerKey: "u:l1", day: "2026-11-02" })).toBe(true);
    expect(await countReplay(db, { recordingId: "r1", listenerKey: "d:abc", day: "2026-11-02" })).toBe(true);
    expect((await listMyRecordings(db, preacher))[0]).toMatchObject({ peakListeners: 214, replayCount: 3 });
  });
});
