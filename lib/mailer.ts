import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Nexora <no-reply@nexora.local>";

/**
 * Shared SMTP transport. Reads generic SMTP_* env vars so it works with any
 * provider (Mailtrap, Gmail, SES, Resend SMTP, ...). `secure` is inferred from
 * the port: 465 uses implicit TLS, everything else uses STARTTLS.
 */
let transporter: nodemailer.Transporter | undefined;

function getTransporter() {
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment.",
    );
  }

  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Reuse a single connection across emails so repeat sends are fast.
    pool: true,
    // Fail fast instead of hanging the process if SMTP is slow/unreachable.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  await getTransporter().sendMail({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/**
 * Simple account-confirmation email sent on resident sign-up. Keeps the markup
 * minimal on purpose — it's just the confirmation link for now.
 */
export async function sendVerificationEmail(to: string, url: string) {
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Confirm your email</h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Thanks for registering with Nexora. Please confirm your email address to
        activate your account.
      </p>
      <a href="${url}"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none; font-size: 14px; padding: 12px 20px; border-radius: 8px;">
        Confirm email
      </a>
      <p style="font-size: 12px; color: #666; line-height: 1.6; margin: 24px 0 0;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a>
      </p>
      <p style="font-size: 12px; color: #666; margin: 16px 0 0;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendMail({
    to,
    subject: "Confirm your Nexora email",
    html,
    text: `Confirm your Nexora email by visiting: ${url}`,
  });
}
