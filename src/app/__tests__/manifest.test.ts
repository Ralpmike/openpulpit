import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("is installable: standalone, start URL, 192 and 512 icons and a maskable one", () => {
    const m = manifest();
    expect(m).toMatchObject({ name: "OpenPulpit", display: "standalone", start_url: "/?source=pwa", scope: "/" });
    expect(m.icons?.map((icon) => `${icon.sizes}:${icon.purpose}`)).toEqual(["192x192:any", "512x512:any", "512x512:maskable"]);
  });
});
