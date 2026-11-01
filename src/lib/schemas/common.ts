import { z } from "zod";

/** Shared validation rules. Compose these into module schemas; never repeat them. */
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use at most 128 characters.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(80, "Keep your name under 80 characters.");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

/** Only same-site paths, so a `next` parameter can't send people elsewhere. */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
