import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/helpers/api/getErrorMessage";

describe("getErrorMessage", () => {
  it("uses the API's plain message when there is one", () => {
    expect(getErrorMessage({ status: 403, data: { error: "No broadcast hours left this month." } })).toBe(
      "No broadcast hours left this month.",
    );
  });

  it("explains network problems in plain words", () => {
    expect(getErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" })).toMatch(/offline/);
  });

  it("falls back by status, and never leaks a thrown error's message", () => {
    expect(getErrorMessage({ status: 404, data: null })).toMatch(/couldn't find/);
    expect(getErrorMessage({ name: "Error", message: "TypeError at line 42", stack: "…" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
