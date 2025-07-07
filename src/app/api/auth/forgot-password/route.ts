import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/user-model";
import { savePasswordResetToken } from "@/lib/forgot-password";
import { sendResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const user = await User.findByEmail(email);
  if (!user) {
    // Explicit feedback for unregistered email (for development/testing)
    return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 404 });
  }
  // If user has no password, they likely signed up with Google/OAuth
  if (!user.password) {
    return NextResponse.json({ error: "This account uses Google sign-in. Please use the 'Sign in with Google' option to log in.", oauth: true }, { status: 403 });
  }
  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiryMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || "60", 10);
  if (isNaN(expiryMinutes) || expiryMinutes <= 0) {
    return NextResponse.json({ error: "Invalid PASSWORD_RESET_TOKEN_EXPIRY_MINUTES env value. Must be a positive integer." }, { status: 500 });
  }
  const expires = new Date(Date.now() + 1000 * 60 * expiryMinutes).toISOString(); // configurable expiry
  try {
    await savePasswordResetToken(user._id, token, expires);
    await sendResetEmail(email, token);
    return NextResponse.json({ message: `Reset email sent. Token valid for ${expiryMinutes} minutes.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send reset email. Please try again later." }, { status: 500 });
  }
}
