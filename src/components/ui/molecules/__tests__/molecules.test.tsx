// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DialogActionFooter } from "@/components/ui/molecules/DialogActionFooter";
import { LiveBadge } from "@/components/ui/molecules/LiveBadge";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";

describe("LoaderButton", () => {
  it("is disabled with a busy state and loading label while pending", () => {
    render(
      <LoaderButton isLoading loadingLabel="Going live…">
        Go live
      </LoaderButton>,
    );
    const button = screen.getByTestId("loader-button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Going live…");
  });

  it("runs its action when not loading", async () => {
    const onClick = vi.fn();
    render(<LoaderButton onClick={onClick}>Follow</LoaderButton>);
    await userEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("LiveBadge", () => {
  it("says Live in words, not only colour", () => {
    render(<LiveBadge />);
    expect(screen.getByTestId("live-badge")).toHaveTextContent("Live");
  });
});

describe("SectionLoadingSkeleton", () => {
  it("announces loading", () => {
    render(<SectionLoadingSkeleton label="Loading sermons" />);
    expect(screen.getByRole("status", { name: "Loading sermons" })).toHaveAttribute("aria-busy", "true");
  });
});

describe("DialogActionFooter", () => {
  it("disables both buttons while the confirm action runs", () => {
    render(
      <DialogActionFooter confirmLabel="Unfollow" onCancel={() => {}} onConfirm={() => {}} isConfirmPending />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByTestId("dialog-confirm-button")).toBeDisabled();
  });
});
