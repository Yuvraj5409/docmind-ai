
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db/prisma.js";
import { sendEmail } from "./email.js";

const trustedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:3000"
)
    .split(",")
    .map((origin) => origin.trim());

export const auth = betterAuth({
    appName: "DocMind AI",

    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins,

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        revokeSessionsOnPasswordReset: true,

        onExistingUserSignUp: async ({ user }) => {
            void sendEmail({
                to: user.email,
                subject: "Someone tried to register using your email",
                text: `Hello,

Someone recently attempted to create a DocMind AI account using your email address.

If this was you, you can simply sign in to your existing account.

If this wasn't you, no action is needed. Your account remains secure.

— DocMind AI Team`,
                html: `
                    <h2>Someone tried to register using your email</h2>
                    <p>Hello,</p>
                    <p>Someone recently attempted to create a DocMind AI account using your email address.</p>
                    <p>If this was you, you can simply sign in to your existing account.</p>
                    <p>If this wasn't you, no action is needed. Your account remains secure.</p>
                    <p>— DocMind AI Team</p>
                `,
            }).catch((error) => {
                console.error("Duplicate signup notification failed:", error);
            });
        },

        sendResetPassword: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: "Reset your DocMind AI password",
                text: `Hello,

We received a request to reset your DocMind AI password.

Use this link to choose a new password:
${url}

If you didn't request this, you can safely ignore this email.

— DocMind AI Team`,
                html: `
                    <h2>Reset your password</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your DocMind AI password.</p>
                    <p><a href="${url}">Reset your password</a></p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>— DocMind AI Team</p>
                `,
            }).catch((error) => {
                console.error("Password reset email failed:", error);
            });
        },
    },

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: false,

        sendVerificationEmail: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: "Verify your DocMind AI email address",
                text: `Hello,

Welcome to DocMind AI!

Please verify your email address using this link:
${url}

If you didn't create this account, you can ignore this email.

— DocMind AI Team`,
                html: `
                    <h2>Welcome to DocMind AI!</h2>
                    <p>Hello,</p>
                    <p>Please verify your email address to complete your registration.</p>
                    <p><a href="${url}">Verify my email address</a></p>
                    <p>If you didn't create this account, you can ignore this email.</p>
                    <p>— DocMind AI Team</p>
                `,
            }).catch((error) => {
                console.error("Email verification failed:", error);
            });
        },
    },
});
