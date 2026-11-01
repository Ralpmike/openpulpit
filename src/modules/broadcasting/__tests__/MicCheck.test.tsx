// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MicCheck } from "@/modules/broadcasting/components/MicCheck";
import type { UseMicCheckReturn } from "@/modules/broadcasting/hooks/useMicCheck";

const base: UseMicCheckReturn = {
  permission: "unknown", level: 0, devices: [], deviceId: null, isChecking: false, hasHeardSound: false, start: vi.fn(), stop: vi.fn(),
};

describe("MicCheck", () => {
  it("explains a blocked microphone and offers to retry", () => {
    render(<MicCheck mic={{ ...base, permission: "denied" }} />);
    expect(screen.getByTestId("mic-denied")).toHaveTextContent("Allow microphone access");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the level and says when it hears the preacher", () => {
    render(<MicCheck mic={{ ...base, permission: "granted", isChecking: true, level: 0.5, hasHeardSound: true }} />);
    expect(screen.getByLabelText("Microphone level")).toBeInTheDocument();
    expect(screen.getByText("We can hear you.")).toBeInTheDocument();
  });
});
