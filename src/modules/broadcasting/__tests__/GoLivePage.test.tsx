// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mic = {
  permission: "granted",
  level: 0.4,
  devices: [],
  deviceId: "mic-1",
  isChecking: true,
  hasHeardSound: true,
  start: vi.fn(),
  stop: vi.fn(),
};
const live = {
  connectionState: "idle",
  isReconnecting: false,
  listenerCount: 0,
  errorMessage: null as string | null,
  start: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock("@/modules/broadcasting/hooks/useMicCheck", () => ({ useMicCheck: () => mic }));
vi.mock("@/modules/broadcasting/hooks/useLiveBroadcast", () => ({ useLiveBroadcast: () => live }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { GoLivePage } from "@/modules/broadcasting/components/GoLivePage";
import { renderWithStore } from "@/test/renderWithStore";

describe("GoLivePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn(async () =>
      Response.json({ data: { id: "b1", title: "Sunday Service", status: "ready" } }, { status: 201 }),
    ) as typeof fetch;
    live.start.mockResolvedValue(true);
  });

  it("goes from details to mic check to live, confirming first", async () => {
    renderWithStore(<GoLivePage />);
    await userEvent.type(screen.getByLabelText("Title"), "Sunday Service");
    await userEvent.click(screen.getByTestId("details-next-button"));
    await waitFor(() => expect(screen.getByTestId("go-live-button")).toBeEnabled());
    expect(mic.start).toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("go-live-button"));
    expect(screen.getByRole("alertdialog", { name: "Go live now?" })).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("confirm-go-live"));

    expect(mic.stop).toHaveBeenCalled();
    expect(live.start).toHaveBeenCalledWith("b1", "mic-1");
    expect(await screen.findByTestId("live-view")).toBeInTheDocument();
  });

  it("refuses an empty title", async () => {
    renderWithStore(<GoLivePage />);
    await userEvent.click(screen.getByTestId("details-next-button"));
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
