import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";

import { getEnv, waitUntil } from "@/lib/cloudflare";
import { consumeRateLimit } from "@/lib/rateLimit";
import { authUserFields } from "@/modules/accounts/server/authSchema";
import { otpEmail, sendEmail } from "@/modules/accounts/server/email";
import { hashPassword, verifyPassword } from "@/modules/accounts/server/password";

function createAuth(env: CloudflareEnv) {
  const salt = env.RATE_LIMIT_SALT || env.BETTER_AUTH_SECRET;
  const emailConfig = { apiKey: env.EMAIL_API_KEY, from: env.EMAIL_FROM, appEnv: env.APP_ENV };
  const hasGoogle = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    appName: "OpenPulpit",
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: env.DB,
    user: { additionalFields: authUserFields },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days: people stay signed in on their phone
      updateAge: 60 * 60 * 24,
      // Saves a D1 read per request. Sensitive routes re-read the session (see requireSession).
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    socialProviders: hasGoogle
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        }
      : {},
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        allowedAttempts: 5,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp, type }) {
          // Not awaited in the request (timing and latency); the Worker keeps running until it's sent.
          waitUntil(sendEmail(otpEmail(email, otp, type), emailConfig).catch((error) => console.error("OTP email failed", error)));
        },
      }),
    ],
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/*": { window: 60, max: 10 },
        "/sign-up/*": { window: 60 * 10, max: 5 },
        "/email-otp/send-verification-otp": { window: 60 * 10, max: 5 },
        "/email-otp/*": { window: 60, max: 10 },
      },
      customStorage: {
        consume: (key, rule) => consumeRateLimit(env.DB, `auth:${key}`, rule, { salt }),
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: env.APP_ENV !== "local",
    },
    databaseHooks: {
      session: {
        create: {
          async before(session) {
            const user = await env.DB.prepare(`SELECT status FROM "user" WHERE id = ?`)
              .bind(session.userId)
              .first<{ status: string }>();
            if (user?.status === "banned" || user?.status === "suspended") {
              throw new APIError("FORBIDDEN", {
                message:
                  user.status === "banned"
                    ? "This account has been banned for breaking the community guidelines."
                    : "This account is suspended. Contact support if you think this is a mistake.",
              });
            }
            // IPs are used for rate limits only and never stored with a session (NDPA 2023).
            return { data: { ...session, ipAddress: null } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

const instances = new WeakMap<D1Database, Auth>();

/** The Better Auth instance for this request's environment. */
export function getAuth(env: CloudflareEnv = getEnv()): Auth {
  let auth = instances.get(env.DB);
  if (!auth) {
    auth = createAuth(env);
    instances.set(env.DB, auth);
  }
  return auth;
}
