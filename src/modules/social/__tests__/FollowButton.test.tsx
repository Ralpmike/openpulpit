// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { FollowButton } from "@/modules/social/components/FollowButton";
import { renderWithStore } from "@/test/renderWithStore";

const notFollowing = { isFollowing: false, notificationsEnabled: false, followerCount: 4, isSelf: false };

describe("FollowButton", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const request = input as Request;
      if (request.method === "PUT") return Response.json({ data: { isFollowing: true, notificationsEnabled: true, followerCount: 5, isSelf: false } });
      return Response.json({ data: notFollowing });
    }) as typeof fetch;
  });

  it("sends visitors to sign in", () => {
    renderWithStore(<FollowButton slug="ade" preacherName="Pastor Ade" initialState={notFollowing} isSignedIn={false} />);
    expect(screen.getByRole("link", { name: "Follow" })).toHaveAttribute("href", "/login?next=%2Fp%2Fade");
  });

  it("follows with a pressed state and an updated count", async () => {
    renderWithStore(<FollowButton slug="ade" preacherName="Pastor Ade" initialState={notFollowing} isSignedIn />);
    const button = await screen.findByRole("button", { name: "Follow" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await waitFor(() => expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByTestId("follower-count")).toHaveTextContent("5 followers");
  });
});
