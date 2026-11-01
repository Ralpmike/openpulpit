// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LiveView } from "@/modules/broadcasting/components/LiveView";

const props = { elapsedSeconds: 754, listenerCount: 214, isReconnecting: false, remainingSeconds: null, isEnding: false, onEnd: vi.fn() };

describe("LiveView", () => {
  it("shows elapsed time and listeners", () => {
    render(<LiveView {...props} />);
    expect(screen.getByTestId("elapsed-time")).toHaveTextContent("12:34");
    expect(screen.getByTestId("listener-count")).toHaveTextContent("214");
  });

  it("asks before ending, saying how many are listening", async () => {
    const onEnd = vi.fn();
    render(<LiveView {...props} onEnd={onEnd} />);
    await userEvent.click(screen.getByTestId("end-broadcast-button"));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("214 people are listening");
    await userEvent.click(screen.getByTestId("confirm-end-broadcast"));
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("shows reconnecting and the hours warning", () => {
    render(<LiveView {...props} isReconnecting remainingSeconds={540} />);
    expect(screen.getByTestId("reconnecting-alert")).toBeInTheDocument();
    expect(screen.getByTestId("hours-warning")).toHaveTextContent("9 min of broadcast time left");
  });
});
