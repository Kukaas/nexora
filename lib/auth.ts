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

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(googleProvider ? { socialProviders: googleProvider } : {}),
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
