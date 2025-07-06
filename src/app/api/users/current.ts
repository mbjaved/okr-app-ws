// API Route: /api/users/current - Returns the current session user for SSR permission logic
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any) {
  // Example: get userId from session cookie (replace 'session' with your cookie name)
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/userId=([a-fA-F0-9]{24})/);
  const userId = sessionMatch ? sessionMatch[1] : null;
  if (!userId) {
    // Debug: Log cookie parsing details for SSR troubleshooting
    // DEBUG: Always log for SSR troubleshooting (remove after fixing SSR userId bug)
    // eslint-disable-next-line no-console
    console.log('[API USERS CURRENT] cookieHeader:', cookieHeader, 'sessionMatch:', sessionMatch, 'userId:', userId);
    return NextResponse.json({ error: "No session user found", cookieHeader, sessionMatch, userId }, { status: 401 });
  }
  const usersCol = await getCollection("users");
  const user = await usersCol.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl });
}
