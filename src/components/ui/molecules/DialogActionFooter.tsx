import { Button } from "@/components/ui/atoms/button";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { cn } from "@/lib/utils";

export interface DialogActionFooterProps {
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirmPending?: boolean;
  isConfirmDisabled?: boolean;
  confirmVariant?: "default" | "destructive";
  className?: string;
}

/** Secondary on the left, primary on the right, side by side. */
export function DialogActionFooter({
  cancelLabel = "Cancel",
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirmPending = false,
  isConfirmDisabled = false,
  confirmVariant = "default",
  className,
}: DialogActionFooterProps) {
  return (
    <div data-testid="dialog-action-footer" className={cn("flex items-center justify-between gap-3", className)}>
      <Button variant="outline" onClick={onCancel} disabled={isConfirmPending}>
        {cancelLabel}
      </Button>
      <LoaderButton
        variant={confirmVariant}
        onClick={onConfirm}
        isLoading={isConfirmPending}
        disabled={isConfirmDisabled}
        data-testid="dialog-confirm-button"
      >
        {confirmLabel}
      </LoaderButton>
    </div>
  );
}
