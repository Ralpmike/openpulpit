import { z } from "zod";

const base64Url = z.string().regex(/^[A-Za-z0-9_-]+$/).max(200);

export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  keys: z.object({ p256dh: base64Url, auth: base64Url }),
});

export const pushUnsubscribeSchema = z.object({ endpoint: z.url().max(1000) });

export const followNotificationsSchema = z.object({ notificationsEnabled: z.boolean() });
