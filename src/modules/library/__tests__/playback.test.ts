import { describe, expect, it } from "vitest";

import type { Viewer } from "@/modules/accounts";
import { getPlayableRecording, getPosition, parseRange, savePosition, streamRecording } from "@/modules/library/server/playback";
import { createTestD1, insertUser } from "@/test/d1";
import { seedPreacher, seedRecording } from "@/test/seed";

const as = (id: string, role: Viewer["role"] = "listener"): Viewer => ({ id, name: id, email: `${id}@x.ng`, image: null, role, status: "active", termsVersion: "" });

function fakeBucket(bytes: Uint8Array): R2Bucket {
  return {
    head: async () => ({ size: bytes.length, httpEtag: '"e"', httpMetadata: { contentType: "audio/ogg" } }),
    get: async (_key: string, options?: { range?: { offset: number; length: number } }) => {
      const { offset = 0, length = bytes.length } = options?.range ?? {};
      return { body: new Blob([bytes.slice(offset, offset + length)]).stream() };
    },
  } as unknown as R2Bucket;
}

describe("replay audio", () => {
  it("parses Range headers", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-9", 100)).toEqual({ offset: 0, length: 10 });
    expect(parseRange("bytes=90-", 100)).toEqual({ offset: 90, length: 10 });
    expect(parseRange("bytes=-20", 100)).toEqual({ offset: 80, length: 20 });
    expect(parseRange("bytes=0-1000", 100)).toEqual({ offset: 0, length: 100 });
    expect(parseRange("bytes=200-", 100)).toBe("invalid");
    expect(parseRange("items=0-1", 100)).toBe("invalid");
  });

  it("answers 206 with Content-Range for seeking, and 416 for bad ranges", async () => {
    const bucket = fakeBucket(new Uint8Array(Array.from({ length: 100 }, (_, i) => i)));
    const partial = await streamRecording(bucket, "k", "bytes=10-19");
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 10-19/100");
    expect(partial.headers.get("accept-ranges")).toBe("bytes");
    expect(Array.from(new Uint8Array(await partial.arrayBuffer()))).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect((await streamRecording(bucket, "k", null)).status).toBe(200);
    expect((await streamRecording(bucket, "k", "bytes=500-")).status).toBe(416);
  });

  it("plays public recordings for anyone, hidden ones only for the owner or an admin", async () => {
    const db = createTestD1();
    seedPreacher(db, "p1");
    seedRecording(db, "pub", "p1");
    seedRecording(db, "hid", "p1", { visibility: "hidden_by_preacher" });
    seedRecording(db, "proc", "p1", { status: "processing" });
    expect(await getPlayableRecording(db, "pub", null)).toMatchObject({ id: "pub", isPublic: true });
    expect(await getPlayableRecording(db, "hid", null)).toBeNull();
    expect(await getPlayableRecording(db, "hid", as("someone"))).toBeNull();
    expect(await getPlayableRecording(db, "hid", as("p1", "preacher"))).toMatchObject({ isPublic: false });
    expect(await getPlayableRecording(db, "hid", as("a1", "admin"))).not.toBeNull();
    expect(await getPlayableRecording(db, "proc", as("p1", "preacher"))).toBeNull();
  });

  it("remembers where a signed-in listener stopped", async () => {
    const db = createTestD1();
    seedPreacher(db, "p1");
    seedRecording(db, "pub", "p1");
    insertUser(db, { id: "l1" });
    expect(await getPosition(db, as("l1"), "pub")).toBe(0);
    await savePosition(db, as("l1"), "pub", 754.6);
    await savePosition(db, as("l1"), "pub", 900);
    expect(await getPosition(db, as("l1"), "pub")).toBe(900);
  });
});
