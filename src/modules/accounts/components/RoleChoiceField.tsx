"use client";

import { HeadphonesIcon, MicIcon } from "lucide-react";
import { Controller, type Control } from "react-hook-form";

import { FieldLabel, FieldLegend, FieldSet } from "@/components/ui/atoms/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/atoms/radio-group";
import type { SignUpFormValues } from "@/modules/accounts/schemas/auth";

const OPTIONS = [
  { value: "listener", title: "I want to listen", description: "Follow preachers and hear when they go live.", icon: HeadphonesIcon },
  { value: "preacher", title: "I'm a preacher", description: "Go live from your phone and keep your sermons.", icon: MicIcon },
] as const;

export interface RoleChoiceFieldProps {
  control: Control<SignUpFormValues>;
}

export function RoleChoiceField({ control }: RoleChoiceFieldProps) {
  return (
    <Controller
      control={control}
      name="role"
      render={({ field }) => (
        <FieldSet data-testid="role-choice">
          <FieldLegend variant="label">How will you use OpenPulpit?</FieldLegend>
          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
            {OPTIONS.map(({ value, title, description, icon: Icon }) => (
              <FieldLabel
                key={value}
                htmlFor={`role-${value}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-secondary"
              >
                <RadioGroupItem id={`role-${value}`} value={value} className="mt-0.5" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon aria-hidden className="size-4" />
                    {title}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">{description}</span>
                </span>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
      )}
    />
  );
}
