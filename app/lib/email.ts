// lib/email.ts
import { Resend } from "resend";

// Initialize Resend with your API Key from the environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  const { data, error } = await resend.emails.send({
    from: "Paynexa Partners <onboarding@resend.dev>", // Replace with your custom domain later once verified
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}