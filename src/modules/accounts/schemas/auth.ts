import { z } from "zod";

import { displayNameSchema, emailSchema, otpSchema, passwordSchema } from "@/lib/schemas/common";

export const passwordSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
export type PasswordSignInFormValues = z.infer<typeof passwordSignInSchema>;

export const emailCodeRequestSchema = z.object({ email: emailSchema });
export type EmailCodeRequestFormValues = z.infer<typeof emailCodeRequestSchema>;

export const emailCodeVerifySchema = z.object({ otp: otpSchema });
export type EmailCodeVerifyFormValues = z.infer<typeof emailCodeVerifySchema>;

export const roleChoiceSchema = z.enum(["listener", "preacher"]);
export type RoleChoice = z.infer<typeof roleChoiceSchema>;

export const signUpSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleChoiceSchema,
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const resetPasswordSchema = z.object({
  otp: otpSchema,
  password: passwordSchema,
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const chooseRoleSchema = z.object({ role: z.literal("preacher") });

export const preacherApplicationSchema = z.object({
  ministry: z.string().trim().min(2, "Enter your ministry or church name.").max(120),
  note: z.string().trim().max(500, "Keep it under 500 characters.").default(""),
});
export type PreacherApplicationFormValues = z.input<typeof preacherApplicationSchema>;

export const applicationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).default(""),
});

export const verificationRequestSchema = z.object({
  message: z.string().trim().max(500, "Keep it under 500 characters.").default(""),
});
export type VerificationRequestFormValues = z.input<typeof verificationRequestSchema>;
