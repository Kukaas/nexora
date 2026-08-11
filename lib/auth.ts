import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mailer";

// Google OAuth is wired but only enabled when credentials are present, so the
// app boots fine without them. Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to
// activate "Continue with Google" on the sign-in page.
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

const isDev = process.env.NODE_ENV !== "production";
const devBaseUrl = `http://localhost:${process.env.PORT || 3001}`;

if (isDev) {
  process.env.BETTER_AUTH_URL = devBaseUrl;
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = devBaseUrl;
}

const configuredBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const auth = betterAuth({
  baseURL: isDev ? devBaseUrl : configuredBaseUrl ?? "https://nexora.kukaass.app",
  trustedOrigins: [
    "https://nexora.kukaass.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    ...(process.env.PORT ? [`http://localhost:${process.env.PORT}`, `http://127.0.0.1:${process.env.PORT}`] : []),
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(googleProvider ? { socialProviders: googleProvider } : {}),
  user: {
    additionalFields: {
      roles: {
        type: "string[]",
        input: false,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail(user.email, url).catch((error) => {
        console.error(`Failed to send reset email to ${user.email}`, error);
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Point the email at our frontend page (which shows a "verifying..."
      // state and calls the API itself) instead of the bare API route that
      // verifies-then-redirects with no UI. The token rides along in the query.
      const base =
        process.env.BETTER_AUTH_URL ??
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
        "http://localhost:3000";
      const token = new URL(url).searchParams.get("token") ?? "";
      const verifyUrl = new URL("/verify-email", base);
      verifyUrl.searchParams.set("token", token);

      void sendVerificationEmail(user.email, verifyUrl.toString()).catch(
        (error) => {
          console.error(
            `Failed to send verification email to ${user.email}`,
            error,
          );
        },
      );
    },
  },
});
