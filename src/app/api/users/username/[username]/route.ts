// API Route: /api/users/username/[username] - Returns a single user by username
// Best Practice: Minimal payload, meaningful errors, defensive coding, typed
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
  designation?: string;
  okrsCount?: number;
  manager?: string | null;
}

interface ApiResponse {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
  department: string;
  designation: string;
  okrsCount: number;
  manager: string | null;
}

// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any): Promise<NextResponse<ApiResponse | { error: string }>> {
  const { username } = context.params;
  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }
  try {
    const usersCol = await getCollection("users");
    const user = await usersCol.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Minimal, robust payload
    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl || `/avatars/${user.username || user.email.split("@")[0]}.svg`,
      role: user.role || "User",
      department: user.department || "-",
      designation: user.designation || "-",
      okrsCount: user.okrsCount || 0,
      manager: user.manager || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
