"use client";

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/atoms/field";
import { Switch } from "@/components/ui/atoms/switch";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { DEFAULT_AUDIO_KBPS, dataUseLabel } from "@/helpers/audio/dataUse";
import { setPrefersHighQuality } from "@/store/playerSlice";

const HIGH_QUALITY_KBPS = 64;

/** Off by default. When on, Wi-Fi listening uses the 64 kbps track if the preacher sends one. */
export function QualityToggle() {
  const dispatch = useAppDispatch();
  const prefersHighQuality = useAppSelector((state) => state.player.prefersHighQuality);
  return (
    <Field orientation="horizontal" data-testid="quality-toggle">
      <FieldContent>
        <FieldLabel htmlFor="high-quality">Higher quality on Wi-Fi</FieldLabel>
        <FieldDescription>
          {prefersHighQuality
            ? `${dataUseLabel(HIGH_QUALITY_KBPS)} on Wi-Fi. On mobile data it stays at ${dataUseLabel(DEFAULT_AUDIO_KBPS).toLowerCase()}.`
            : `Data saver is on: ${dataUseLabel(DEFAULT_AUDIO_KBPS).toLowerCase()}.`}
        </FieldDescription>
      </FieldContent>
      <Switch
        id="high-quality"
        checked={prefersHighQuality}
        onCheckedChange={(checked) => dispatch(setPrefersHighQuality(checked))}
      />
    </Field>
  );
}
