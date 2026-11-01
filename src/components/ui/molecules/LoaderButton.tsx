import type { ComponentProps } from "react";

import { Button } from "@/components/ui/atoms/button";
import { Spinner } from "@/components/ui/atoms/spinner";

export interface LoaderButtonProps extends ComponentProps<typeof Button> {
  /** True while the action runs: shows a spinner and blocks repeat taps. */
  isLoading?: boolean;
  /** Read by screen readers while loading, e.g. "Going live". */
  loadingLabel?: string;
}

export function LoaderButton({
  isLoading = false,
  loadingLabel,
  disabled,
  children,
  "data-testid": testId = "loader-button",
  ...props
}: LoaderButtonProps & { "data-testid"?: string }) {
  return (
    <Button
      data-testid={testId}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner data-icon="inline-start" aria-hidden /> : null}
      {isLoading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
