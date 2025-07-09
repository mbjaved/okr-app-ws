// API Route: /api/users - Returns all users for Teams page
// Best Practice: Modular, secure, typed, business logic separated from UI
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";

export type TeamUser = {
  _id: ObjectId;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: string;
  department?: string;
  designation?: string;
  okrsCount?: number;
  active?: boolean; // Added: user is active (default true)
};

export async function GET(req: NextRequest) {
  const usersCol = await getCollection("users");
  // For demo, fetch all users. In production, add auth checks and pagination.
  const users = await usersCol.find({}).toArray();
  // Aggregate OKRs count per user (robust, modular, typed)
  const okrsCol = await getCollection("okrs");
  // Get all OKRs, only owners field
  const allOkrs = await okrsCol.find({}, { projection: { owners: 1 } }).toArray();
  // Build a map of userId to OKR count
  const okrsCountMap: Record<string, number> = {};
  for (const okr of allOkrs) {
    if (Array.isArray(okr.owners)) {
      for (const owner of okr.owners) {
        const ownerId = typeof owner === 'object' && owner._id ? owner._id.toString() : owner?.toString();
        if (ownerId) {
          okrsCountMap[ownerId] = (okrsCountMap[ownerId] || 0) + 1;
        }
      }
    }
  }
  // Map to TeamUser type and add OKR count
  const teamUsers: TeamUser[] = users.map((u: any) => ({
    _id: u._id,
    name: u.name,
    username: u.username || u.email.split("@")[0],
    email: u.email,
    avatarUrl: u.avatarUrl || `/avatars/${u.username || u.email.split("@")[0]}.svg`,
    role: u.role || "User",
    department: u.department || "-",
    designation: u.designation || "-",
    okrsCount: okrsCountMap[u._id.toString()] || 0,
    manager: u.manager || null,
    active: u.active !== false, // Default to true for legacy users
  }));
  return NextResponse.json(teamUsers);
}

// Best Practice: This API route is modular, secure (add auth checks in production), and typed. Business logic is separated from UI. Log this step in DEVELOPMENT_TIMELINE.md.

export async function PATCH(req: NextRequest) {
  try {
    const usersCol = await getCollection("users");
    const body = await req.json();
    const id = body.id || body._id;
    const fields = { ...body };
    delete fields.id;
    delete fields._id;
    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    // Only allow certain fields to be updated
    const allowed = ["name", "email", "department", "designation", "manager", "active", "avatarUrl"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) update[key] = fields[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const result = await usersCol.findOneAndUpdate(
      { _id: typeof id === 'string' ? new ObjectId(id) : id },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result.value) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(result.value);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
