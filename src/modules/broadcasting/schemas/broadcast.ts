import { z } from "zod";

/** "John 3:16", "Psalm 23", "1 Corinthians 13:4-7" — kept as typed, length-limited. */
export const biblePassageSchema = z
  .string()
  .trim()
  .max(60, "Keep the passage under 60 characters.")
  .regex(/^[\p{L}\p{N}\s.:,;–—-]*$/u, "Use a reference like John 3:16-18.");

export const broadcastDetailsSchema = z.object({
  title: z.string().trim().min(3, "Give your broadcast a title (at least 3 characters).").max(120, "Keep the title under 120 characters."),
  description: z.string().trim().max(1000, "Keep the description under 1,000 characters.").default(""),
  biblePassage: biblePassageSchema.default(""),
});
export type BroadcastDetailsFormValues = z.input<typeof broadcastDetailsSchema>;
export type BroadcastDetailsInput = z.output<typeof broadcastDetailsSchema>;
