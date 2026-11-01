import { describe, expect, it } from "vitest";

import { searchPreachers, toFtsQuery } from "@/modules/accounts/server/search";
import { createTestD1 } from "@/test/d1";
import { seedPreacher } from "@/test/seed";

function setup() {
  const db = createTestD1();
  seedPreacher(db, "p1", { name: "Pastor Adebayo Ogunleye", isVerified: true });
  seedPreacher(db, "p2", { name: "Rev. Chiamaka Eze" });
  seedPreacher(db, "p3", { name: "Evangelist Musa Danjuma", status: "suspended" });
  db.sqlite.prepare("UPDATE preacher_profiles SET ministry = 'Living Word Chapel', city = 'Ibadan', state = 'Oyo', denomination = 'Pentecostal' WHERE user_id = 'p1'").run();
  db.sqlite.prepare("UPDATE preacher_profiles SET ministry = 'Grace Assembly', city = 'Enugu', state = 'Enugu', denomination = 'Anglican' WHERE user_id = 'p2'").run();
  return db;
}

describe("preacher search", () => {
  it("finds by name, ministry, city, state and denomination, with prefixes", async () => {
    const db = setup();
    const slugs = async (q: string) => (await searchPreachers(db, q)).map((p) => p.slug);
    expect(await slugs("adebayo")).toEqual(["pastor-p1"]);
    expect(await slugs("grace")).toEqual(["pastor-p2"]);
    expect(await slugs("ibad")).toEqual(["pastor-p1"]);
    expect(await slugs("anglican")).toEqual(["pastor-p2"]);
    expect(await slugs("pastor ibadan")).toEqual(["pastor-p1"]);
  });

  it("leaves out suspended preachers and survives odd input", async () => {
    const db = setup();
    expect(await searchPreachers(db, "musa")).toEqual([]);
    // Operators are just words: every word must match, so this finds nobody instead of everybody.
    expect(await searchPreachers(db, 'adebayo" OR 1=1 --')).toEqual([]);
    expect(await searchPreachers(db, "*** ()")).toEqual([]);
  });

  it("quotes every word", () => {
    expect(toFtsQuery("Pastor  Adébáyọ̀!")).toBe('"pastor"* "adebayo"*');
    expect(toFtsQuery("  ")).toBeNull();
  });
});
