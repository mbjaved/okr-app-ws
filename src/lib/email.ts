import sgMail from "@sendgrid/mail";

interface MentionNotificationData {
  mentionedUserEmail: string;
  mentionedUserName: string;
  commenterName: string;
  okrTitle: string;
  okrId: string;
  commentContent: string;
}

export async function sendResetEmail(email: string, token: string) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "no-reply@yourdomain.com";
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

export async function sendMentionNotification(data: MentionNotificationData) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "no-reply@yourdomain.com";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const okrLink = `${baseUrl}/okrs/${data.okrId}`;

  if (!sendgridApiKey) {
    throw new Error("SENDGRID_API_KEY is not set in environment variables");
  }
  sgMail.setApiKey(sendgridApiKey);

  const msg = {
    to: data.mentionedUserEmail,
    from: fromEmail,
    subject: `You were mentioned in a comment on "${data.okrTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You were mentioned in a comment</h2>
        <p>Hi ${data.mentionedUserName},</p>
        <p><strong>${data.commenterName}</strong> mentioned you in a comment on the OKR:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #555;">${data.okrTitle}</h3>
        </div>
        <div style="background: #fff; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0;">
          <p style="margin: 0; font-style: italic;">${data.commentContent}</p>
        </div>
        <p>
          <a href="${okrLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View OKR and Comment</a>
        </p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from your OKR App.</p>
      </div>
    `
  };
  
  await sgMail.send(msg);
}
