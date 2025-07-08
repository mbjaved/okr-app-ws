// API Route: /api/users/[id] - Returns a single user by ID
// Best Practice: Minimal payload, meaningful errors, defensive coding, typed
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";

// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }
  try {
    const usersCol = await getCollection("users");
    const user = await usersCol.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Minimal, robust payload
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      username: user.username || user.email.split("@")[0],
      email: user.email,
      avatarUrl: user.avatarUrl || `/avatars/${user.username || user.email.split("@")[0]}.svg`,
      role: user.role || "User",
      department: user.department || "-",
      designation: user.designation || "-",
      okrsCount: user.okrsCount || 0,
      manager: user.manager || null,
      active: user.active !== false, // Default to true for legacy users
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
