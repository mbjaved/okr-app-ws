// API Route: /api/users/bulk - Bulk user actions (role assignment, deactivate, reset password)
// Best Practice: Modular, secure, typed, business logic separated from UI
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";
import { sendResetEmail } from "@/lib/email";

export async function PATCH(req: NextRequest) {
  // Bulk update users (role assignment, deactivate/reactivate)
  try {
    const usersCol = await getCollection("users");
    const { userIds, action, value } = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array required" }, { status: 400 });
    }
    // Only allow certain actions
    if (!["assignRole", "deactivate", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const filter = { _id: { $in: userIds.map((id: string) => new ObjectId(id)) } };
    let update: any = {};
    if (action === "assignRole") {
      if (!value || typeof value !== "string") return NextResponse.json({ error: "Role value required" }, { status: 400 });
      update = { $set: { role: value } };
    } else if (action === "deactivate") {
      update = { $set: { active: false } };
    } else if (action === "activate") {
      update = { $set: { active: true } };
    }
    const result = await usersCol.updateMany(filter, update);
    return NextResponse.json({ modifiedCount: result.modifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Bulk password reset (send reset email)
  try {
    const usersCol = await getCollection("users");
    const { userIds } = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array required" }, { status: 400 });
    }
    const users = await usersCol.find({ _id: { $in: userIds.map((id: string) => new ObjectId(id)) } }).toArray();
    let sent = 0;
    for (const user of users) {
      if (user.email) {
        await sendResetEmail(user.email, user._id.toString());
        sent++;
      }
    }
    return NextResponse.json({ sent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
