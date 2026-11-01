// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const social = vi.fn();
vi.mock("@/lib/authClient", () => ({
  authClient: { signIn: { social: (...args: unknown[]) => social(...args) } },
  authErrorMessage: () => "Google sign-in failed",
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { GoogleSignInButton } from "@/modules/accounts/components/GoogleSignInButton";

describe("GoogleSignInButton", () => {
  it("starts Google sign-in, returning to where the person was", async () => {
    social.mockReturnValue(new Promise(() => {}));
    render(<GoogleSignInButton callbackPath="/go-live" />);
    await userEvent.click(screen.getByRole("button", { name: /Continue with Google/ }));
    expect(social).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google", callbackURL: "/go-live", errorCallbackURL: "/login?error=google" }),
    );
    expect(screen.getByTestId("google-sign-in-button")).toBeDisabled();
  });

  it("lets the person try again if Google can't start", async () => {
    social.mockResolvedValue({ error: { message: "nope" } });
    render(<GoogleSignInButton callbackPath="/" />);
    await userEvent.click(screen.getByRole("button", { name: /Continue with Google/ }));
    expect(screen.getByTestId("google-sign-in-button")).not.toBeDisabled();
  });
});
