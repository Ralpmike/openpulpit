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

export const signUpSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const resetPasswordSchema = z.object({
  otp: otpSchema,
  password: passwordSchema,
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
