import sgMail from "@sendgrid/mail";

export async function sendResetEmail(email: string, token: string) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@yourdomain.com";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  if (!sendgridApiKey) {
    throw new Error("SENDGRID_API_KEY is not set in environment variables");
  }
  sgMail.setApiKey(sendgridApiKey);

  const msg = {
    to: email,
    from: fromEmail,
    subject: "Reset your OKR App password",
    html: `<p>Hello,<br/>You requested a password reset for your OKR App account.<br/><br/>Click <a href="${resetLink}">here</a> to reset your password.<br/><br/>If you did not request this, you can ignore this email.</p>`
  };
  await sgMail.send(msg);
}
