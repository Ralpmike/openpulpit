import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface EmailConfig {
  apiKey?: string;
  from?: string;
  appEnv?: string;
}

/**
 * Sends an account email through Resend's HTTP API. Without an API key
 * (local development) the message is printed to the server log instead.
 */
export async function sendEmail(message: EmailMessage, config: EmailConfig): Promise<void> {
  if (!config.apiKey) {
    if (config.appEnv === "production") throw new Error("EMAIL_API_KEY is not set");
    console.info(`[email to ${message.to}] ${message.subject}\n${message.text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: config.from || "OpenPulpit <no-reply@openpulpit.app>",
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      tags: [{ name: "category", value: "account" }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Email provider answered ${response.status}`);
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type OtpPurpose = "sign-in" | "email-verification" | "forget-password" | "change-email";

const OTP_SUBJECTS: Record<OtpPurpose, string> = {
  "sign-in": "Your OpenPulpit sign-in code",
  "email-verification": "Confirm your email for OpenPulpit",
  "forget-password": "Reset your OpenPulpit password",
  "change-email": "Confirm your new email for OpenPulpit",
};

/** The one-time code email. Plain, short, no images: it should arrive and open fast. */
export function otpEmail(to: string, otp: string, purpose: OtpPurpose): EmailMessage {
  const subject = OTP_SUBJECTS[purpose];
  const action = purpose === "forget-password" ? "reset your password" : "continue";
  const text = `Your code is ${otp}\n\nEnter it in OpenPulpit to ${action}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`;
  const html = `<p>Your code is</p><p style="font-size:28px;font-weight:600;letter-spacing:4px">${escapeHtml(otp)}</p><p>Enter it in OpenPulpit to ${action}. It expires in 10 minutes.</p><p style="color:#666">If you didn't ask for this, you can ignore this email.</p>`;
  return { to, subject, text, html };
}
