import { NextRequest, NextResponse } from "next/server";
import { findUserIdByResetToken, markTokenUsed } from "@/lib/forgot-password";
import { getCollection } from "@/lib/mongodb-utils";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Both token and new password are required to reset your password." }, { status: 400 });
    }
    const userId = await findUserIdByResetToken(token);
    if (!userId) {
      return NextResponse.json({ error: "This password reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    }
    const users = await getCollection("users");
    const hashed = await hash(password, 10);
    const updateResult = await users.updateOne({ _id: userId }, { $set: { password: hashed } });
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Unable to update password. Please try again or contact support." }, { status: 500 });
    }
    await markTokenUsed(token);
    return NextResponse.json({ message: "Your password has been reset successfully. You may now log in with your new password." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred while resetting your password." }, { status: 500 });
  }
}
