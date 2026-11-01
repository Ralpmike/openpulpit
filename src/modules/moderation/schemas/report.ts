import { z } from "zod";

export const REPORT_REASONS = [
  { value: "hate_speech", label: "Hate speech", description: "Attacks people for their tribe, religion or who they are" },
  { value: "violence", label: "Incitement to violence", description: "Calls for or threatens violence" },
  { value: "harassment", label: "Harassment", description: "Targets or threatens a particular person" },
  { value: "fraud_or_scam", label: "Fraud or scam", description: "Asks for money dishonestly, fake promises" },
  { value: "illegal", label: "Illegal content", description: "Breaks the law, or harms children" },
  { value: "other", label: "Something else", description: "Tell us what's wrong" },
] as const;

export const reportSchema = z
  .object({
    targetType: z.enum(["broadcast", "recording", "profile"]),
    targetId: z.string().trim().min(1).max(100),
    reason: z.enum(["hate_speech", "violence", "harassment", "fraud_or_scam", "illegal", "other"], { message: "Choose a reason." }),
    details: z.string().trim().max(1000, "Keep it under 1,000 characters.").default(""),
  })
  .refine((report) => report.reason !== "other" || report.details.length >= 5, {
    message: "Tell us briefly what's wrong.",
    path: ["details"],
  });
export type ReportFormValues = z.input<typeof reportSchema>;
export type ReportInput = z.output<typeof reportSchema>;
export type ReportTargetType = ReportInput["targetType"];
