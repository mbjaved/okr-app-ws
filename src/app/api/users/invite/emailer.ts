// ENV REQUIRED: SENDGRID_API_KEY, FROM_EMAIL
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendInviteEmail(email: string, origin: string) {
  const registerUrl = `${origin}/register?email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL || 'OKR Tracker <no-reply@okr-app.local>',
    subject: 'You are invited to join OKR Tracker',
    html: `<p>Hello,</p><p>You have been invited to join OKR Tracker. Click the link below to register:</p><p><a href="${registerUrl}">${registerUrl}</a></p><p>If you did not expect this, you can ignore this email.</p>`
  };
  await sgMail.send(msg);
}
