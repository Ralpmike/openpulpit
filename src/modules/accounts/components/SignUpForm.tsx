"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { RoleChoiceField } from "@/modules/accounts/components/RoleChoiceField";
import { TermsField } from "@/modules/accounts/components/TermsField";
import { signUpSchema, type SignUpFormValues } from "@/modules/accounts/schemas/auth";

export interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  /** Extra fields from later steps (role choice, terms) render above the button. */
  children?: ReactNode;
  isSubmitDisabled?: boolean;
}

export function SignUpForm({ onSubmit, children, isSubmitDisabled = false }: SignUpFormProps) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: "listener", acceptsTerms: false as unknown as true },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="sign-up-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="name" label="Your name" autoComplete="name" data-testid="sign-up-name" />
        <FormFieldInput control={form.control} name="email" label="Email" type="email" inputMode="email" autoComplete="email" data-testid="sign-up-email" />
        <FormFieldInput
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
          data-testid="sign-up-password"
        />
        <RoleChoiceField control={form.control} />
        <TermsField control={form.control} name="acceptsTerms" />
        {children}
        <LoaderButton type="submit" size="lg" disabled={isSubmitDisabled} isLoading={form.formState.isSubmitting} loadingLabel="Creating your account…" data-testid="sign-up-button">
          Create account
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
