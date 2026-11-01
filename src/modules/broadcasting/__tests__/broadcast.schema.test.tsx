// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BroadcastDetailsForm } from "@/modules/broadcasting/components/BroadcastDetailsForm";
import { broadcastDetailsSchema } from "@/modules/broadcasting/schemas/broadcast";

describe("broadcastDetailsSchema", () => {
  it("needs a title of 3–120 characters", () => {
    expect(broadcastDetailsSchema.safeParse({ title: "Hi" }).success).toBe(false);
    expect(broadcastDetailsSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
    expect(broadcastDetailsSchema.parse({ title: "  Sunday Service  " })).toEqual({ title: "Sunday Service", description: "", biblePassage: "" });
  });

  it("accepts real Bible references and refuses markup", () => {
    for (const passage of ["John 3:16", "1 Corinthians 13:4-7", "Psalm 23", "Romans 8:28; 12:1–2"]) {
      expect(broadcastDetailsSchema.safeParse({ title: "Sermon", biblePassage: passage }).success).toBe(true);
    }
    expect(broadcastDetailsSchema.safeParse({ title: "Sermon", biblePassage: "<script>" }).success).toBe(false);
    expect(broadcastDetailsSchema.safeParse({ title: "Sermon", description: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("BroadcastDetailsForm", () => {
  it("submits title, passage and description", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<BroadcastDetailsForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("Title"), "Walking in Faith");
    await userEvent.type(screen.getByLabelText("Bible passage (optional)"), "Hebrews 11:1-6");
    await userEvent.type(screen.getByLabelText("Description (optional)"), "Sunday teaching");
    await userEvent.click(screen.getByTestId("details-next-button"));
    expect(onSubmit).toHaveBeenCalledWith(
      { title: "Walking in Faith", biblePassage: "Hebrews 11:1-6", description: "Sunday teaching" },
      expect.anything(),
    );
  });
});
