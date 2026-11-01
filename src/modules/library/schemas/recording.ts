import { z } from "zod";

import { broadcastDetailsSchema } from "@/modules/broadcasting/schemas/broadcast";

/** Same rules as a broadcast's details (requirement 20). */
export const recordingDetailsSchema = broadcastDetailsSchema;
export type RecordingDetailsFormValues = z.input<typeof recordingDetailsSchema>;

export const recordingVisibilitySchema = z.object({ isHidden: z.boolean() });
