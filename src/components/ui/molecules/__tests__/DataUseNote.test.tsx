// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataUseNote } from "@/components/ui/molecules/DataUseNote";
import { dataUseLabel } from "@/helpers/audio/dataUse";

describe("DataUseNote", () => {
  it("states the estimate in words, with context for screen readers", () => {
    render(<DataUseNote label={dataUseLabel()} />);
    expect(screen.getByTestId("data-use-note")).toHaveTextContent("About 14 MB per hour of mobile data");
  });
});
