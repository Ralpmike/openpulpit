import { z } from "zod";

import { NIGERIAN_STATES } from "@/helpers/nigeria/states";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters.")
  .max(40, "Use at most 40 characters.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use letters, numbers and single hyphens only.");

export const preacherProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter the name listeners know you by.").max(80),
  slug: slugSchema,
  ministry: z.string().trim().min(2, "Enter your ministry or church name.").max(120),
  state: z.enum(NIGERIAN_STATES, { message: "Choose your state." }),
  city: z.string().trim().min(2, "Enter your city or town.").max(60),
  denomination: z.string().trim().max(60).default(""),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters.").default(""),
});
export type PreacherProfileFormValues = z.input<typeof preacherProfileSchema>;
export type PreacherProfileInput = z.output<typeof preacherProfileSchema>;

export const PHOTO_MAX_BYTES = 1024 * 1024;
export const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
