"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch, type UseFormSetError } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/atoms/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select";
import { Textarea } from "@/components/ui/atoms/textarea";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { NIGERIAN_STATES } from "@/helpers/nigeria/states";
import { slugify } from "@/helpers/text/slug";
import { preacherProfileSchema, type PreacherProfileFormValues } from "@/modules/accounts/schemas/profile";

export interface PreacherProfileFormProps {
  defaultValues: PreacherProfileFormValues;
  /** True when the preacher hasn't saved a profile yet: the link follows their name. */
  isNew: boolean;
  onSubmit: (values: PreacherProfileFormValues, setError: UseFormSetError<PreacherProfileFormValues>) => Promise<void>;
  isSubmitting: boolean;
}

export function PreacherProfileForm({ defaultValues, isNew, onSubmit, isSubmitting }: PreacherProfileFormProps) {
  const form = useForm<PreacherProfileFormValues>({ resolver: zodResolver(preacherProfileSchema), defaultValues });
  const displayName = useWatch({ control: form.control, name: "displayName" });
  const slug = useWatch({ control: form.control, name: "slug" });

  useEffect(() => {
    if (isNew && !form.getFieldState("slug").isDirty) {
      form.setValue("slug", slugify(displayName ?? ""), { shouldValidate: false });
    }
  }, [displayName, isNew, form]);

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values, form.setError))} noValidate data-testid="preacher-profile-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="displayName" label="Name listeners know you by" autoComplete="name" data-testid="profile-display-name" />
        <FormFieldInput
          control={form.control}
          name="slug"
          label="Your profile link"
          description={`openpulpit.app/p/${slug || "your-name"}`}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-testid="profile-slug"
        />
        <FormFieldInput control={form.control} name="ministry" label="Ministry or church" autoComplete="organization" data-testid="profile-ministry" />
        <Controller
          control={form.control}
          name="state"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="profile-state">State</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="profile-state" className="w-full" aria-invalid={fieldState.invalid || undefined} data-testid="profile-state">
                  <SelectValue placeholder="Choose your state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <FormFieldInput control={form.control} name="city" label="City or town" autoComplete="address-level2" data-testid="profile-city" />
        <FormFieldInput control={form.control} name="denomination" label="Denomination (optional)" data-testid="profile-denomination" />
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="profile-bio">Short bio (optional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="profile-bio" maxLength={500} aria-describedby="profile-bio-help" data-testid="profile-bio" />
              <FieldDescription id="profile-bio-help">{(field.value ?? "").length}/500. What listeners should know about your preaching.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <LoaderButton type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Saving…" data-testid="save-profile-button">
          Save profile
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
