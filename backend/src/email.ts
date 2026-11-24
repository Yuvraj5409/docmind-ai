
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Resend } from "resend";

// Load environment variables from the project-root .env file.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(currentDirectory, "../../.env"),
});

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing from the root .env file");
}

const resend = new Resend(apiKey);

const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    "DocMind AI <onboarding@resend.dev>";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export async function sendEmail({
    to,
    subject,
    html,
    text,
}: SendEmailOptions) {
    const { data, error } = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(`Resend email failed: ${error.message}`);
    }

    return data;
}
