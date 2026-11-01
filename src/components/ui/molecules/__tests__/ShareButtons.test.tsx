// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ShareButtons } from "@/components/ui/molecules/ShareButtons";
import { shareMetadata } from "@/lib/metadata";

describe("sharing", () => {
  it("opens WhatsApp with the title and full link", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ShareButtons path="/r/abc" text="Walking in Faith by Pastor Ade" />);
    await userEvent.click(screen.getByTestId("share-whatsapp"));
    expect(open).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent("Walking in Faith by Pastor Ade\nhttp://localhost:3000/r/abc")}`,
      "_blank",
      "noopener",
    );
  });

  it("builds Open Graph and Twitter tags, with the preacher's photo when there is one", () => {
    const withPhoto = shareMetadata({ title: "Sermon", description: "d", path: "/r/1", image: "/api/media/avatars/p/1.webp" });
    expect(withPhoto.openGraph?.images).toEqual([{ url: "/api/media/avatars/p/1.webp", width: 512, height: 512, alt: "Sermon" }]);
    expect(withPhoto.twitter).toMatchObject({ card: "summary" });
    const without = shareMetadata({ title: "Sermon", description: "d", path: "/r/1" });
    expect(without.openGraph?.images).toEqual([expect.objectContaining({ url: "/og-default.png", width: 1200, height: 630 })]);
    expect(without.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
