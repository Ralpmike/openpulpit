import { describe, expect, it } from "vitest";
import { z } from "zod";

import { forbidden, ok, parseJson, route } from "@/lib/api";

describe("route()", () => {
  it("wraps data and turns ApiError and ZodError into plain { error } responses", async () => {
    expect(await (await ok({ a: 1 })).json()).toEqual({ data: { a: 1 } });
    const denied = await route(async () => {
      throw forbidden("Only preachers can do that.");
    })();
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: "Only preachers can do that." });
    const invalid = await route(async () => {
      z.object({ title: z.string().min(3) }).parse({ title: "x" });
      return ok(null);
    })();
    expect(invalid.status).toBe(400);
  });

  it("hides unexpected errors", async () => {
    const response = await route(async () => {
      throw new Error("D1_ERROR: no such column secret_thing");
    })();
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret_thing");
  });

  it("refuses bodies that aren't JSON", async () => {
    const request = new Request("http://x", { method: "POST", body: "a=1", headers: { "content-type": "application/x-www-form-urlencoded" } });
    await expect(parseJson(request, z.object({}))).rejects.toMatchObject({ status: 400 });
  });
});
