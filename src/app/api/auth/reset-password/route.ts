import { NextRequest, NextResponse } from "next/server";
import { findUserIdByResetToken, markTokenUsed } from "@/lib/forgot-password";
import { getCollection } from "@/lib/mongodb-utils";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }
  const userId = await findUserIdByResetToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }
  const users = await getCollection("users");
  const hashed = await hash(password, 10);
  await users.updateOne({ _id: userId }, { $set: { password: hashed } });
  await markTokenUsed(token);
  return NextResponse.json({ message: "Password reset successful." });
}
