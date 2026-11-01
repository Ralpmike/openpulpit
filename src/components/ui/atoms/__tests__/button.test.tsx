// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/atoms/button";

describe("Button", () => {
  it("renders an accessible button that responds to clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go live</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go live" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
