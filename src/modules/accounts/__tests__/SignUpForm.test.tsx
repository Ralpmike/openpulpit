// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignUpForm } from "@/modules/accounts/components/SignUpForm";

describe("SignUpForm", () => {
  it("shows errors linked to their fields and doesn't submit invalid input", async () => {
    const onSubmit = vi.fn();
    render(<SignUpForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByTestId("sign-up-button"));
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password.getAttribute("aria-describedby")).toContain("field-password-error");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits clean values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SignUpForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Your name"), "Ada Obi");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.ng");
    await userEvent.type(screen.getByLabelText("Password"), "Psalm23-is-mine");
    await userEvent.click(screen.getByLabelText(/I'm a preacher/));
    await userEvent.click(screen.getByTestId("accept-terms"));
    await userEvent.click(screen.getByTestId("sign-up-button"));
    expect(onSubmit).toHaveBeenCalledWith(
      { name: "Ada Obi", email: "ada@example.ng", password: "Psalm23-is-mine", role: "preacher", acceptsTerms: true },
      expect.anything(),
    );
  });
});
