import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOrderEmail(input: { to?: string | null; subject: string; html: string }) {
  if (!resend || !input.to) return;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PrintFloww <orders@example.com>",
    to: input.to,
    subject: input.subject,
    html: input.html
  });
}
