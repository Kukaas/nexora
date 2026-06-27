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

/**
 * Welcome email for an official account an admin just created. Unlike the
 * resident verification email, this one carries the temporary password the admin
 * generated, so the official has everything they need in one place: confirm the
 * email, then sign in with the temporary password (they're asked to choose their
 * own right after). The password is shown in plain text on purpose — it's
 * single-use-ish and they replace it on first sign-in.
 */
export async function sendOfficialWelcomeEmail(
  to: string,
  options: { name: string; roleLabel: string; tempPassword: string; verifyUrl: string },
) {
  const { name, roleLabel, tempPassword, verifyUrl } = options;
  const firstName = name.trim().split(/\s+/)[0] || "there";

  const html = `
    <div style="font-family: 'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Welcome to Nexora, ${firstName}</h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px; color: #3d3d3d;">
        An administrator created a <strong>${roleLabel}</strong> account for you at
        Barangay Libtangin. Here's how to get in:
      </p>

      <p style="font-size: 13px; font-weight: 600; margin: 0 0 6px; color: #1a1a1a;">
        1. Confirm your email
      </p>
      <a href="${verifyUrl}"
         style="display: inline-block; background: #f59e0b; color: #3a2a00; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 26px; margin: 0 0 20px;">
        Confirm email
      </a>

      <p style="font-size: 13px; font-weight: 600; margin: 0 0 6px; color: #1a1a1a;">
        2. Sign in with this temporary password
      </p>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px; font-weight: 600; letter-spacing: 0.04em; background: #f4f4f5; border-radius: 12px; padding: 12px 16px; margin: 0 0 8px; color: #1a1a1a;">
        ${tempPassword}
      </div>
      <p style="font-size: 13px; line-height: 1.6; margin: 0 0 20px; color: #6b6b6b;">
        You'll be asked to set your own password right after your first sign-in,
        so this one stops working once you do.
      </p>

      <p style="font-size: 12px; color: #6b6b6b; line-height: 1.6; margin: 0;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${verifyUrl}" style="color: #a15c00; word-break: break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size: 12px; color: #6b6b6b; margin: 16px 0 0;">
        If you weren't expecting this, you can ignore this email or contact the
        barangay office.
      </p>
    </div>
  `;

  await sendMail({
    to,
    subject: "Your Nexora official account",
    html,
    text:
      `An administrator created a ${roleLabel} account for you at Barangay Libtangin.\n\n` +
      `1. Confirm your email: ${verifyUrl}\n` +
      `2. Sign in with this temporary password: ${tempPassword}\n\n` +
      `You'll set your own password right after your first sign-in.`,
  });
}

/**
 * Password-reset email. Triggered by Better Auth's `sendResetPassword` when a
 * resident requests a reset from the forgot-password page. The link is
 * single-use and expires; the copy says so in plain language.
 */
export async function sendPasswordResetEmail(to: string, url: string) {
  const html = `
    <div style="font-family: 'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #3d3d3d;">
        We received a request to reset the password for your Nexora account.
        Click the button below to choose a new one. This link can only be used
        once and will expire soon.
      </p>
      <a href="${url}"
         style="display: inline-block; background: #f59e0b; color: #3a2a00; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 26px;">
        Reset password
      </a>
      <p style="font-size: 12px; color: #6b6b6b; line-height: 1.6; margin: 24px 0 0;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${url}" style="color: #a15c00; word-break: break-all;">${url}</a>
      </p>
      <p style="font-size: 12px; color: #6b6b6b; margin: 16px 0 0;">
        If you didn't request this, you can safely ignore this email. Your
        password won't change until you open the link above.
      </p>
    </div>
  `;

  await sendMail({
    to,
    subject: "Reset your Nexora password",
    html,
    text: `Reset your Nexora password by visiting: ${url}`,
  });
}
