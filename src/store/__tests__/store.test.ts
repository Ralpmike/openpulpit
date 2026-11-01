import { describe, expect, it } from "vitest";

import { makeStore } from "@/store";
import { TAG_TYPES } from "@/store/api";
import { dismissInstallPrompt } from "@/store/uiSlice";

describe("makeStore", () => {
  it("creates independent stores with the api, ui and player slices", () => {
    const first = makeStore();
    const second = makeStore();
    first.dispatch(dismissInstallPrompt());
    expect(first.getState().ui.isInstallPromptDismissed).toBe(true);
    expect(second.getState().ui.isInstallPromptDismissed).toBe(false);
    expect(Object.keys(first.getState())).toEqual(expect.arrayContaining(["api", "ui", "player"]));
  });

  it("declares the shared cache tags once", () => {
    expect(new Set(TAG_TYPES).size).toBe(TAG_TYPES.length);
  });
});
