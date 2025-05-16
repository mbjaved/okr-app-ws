import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { OKR } from "@/lib/okr-model";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: Get userId from session
async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return null;
  const users = await getCollection("users");
  const user = await users.findOne({ email: session.user.email });
  return user?._id;
}

// GET /api/okrs/:okrId - Get single OKR
// Best_Practices.md: Typed API contracts for Next.js Route Handlers
// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  const okr = await okrs.findOne({ _id: new ObjectId(params.okrId) });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(okr);
}

// PUT /api/okrs/:okrId - Update OKR
export async function PUT(req: NextRequest, context: any) {
  const { params } = context;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  const data = await req.json();
  // Only allow update if user owns the OKR or is a department manager (future extension)
  const okr = await okrs.findOne({ _id: new ObjectId(params.okrId) });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }
  // Remove _id from update payload to avoid immutable field error
  if ('_id' in data) delete data._id;
  data.updatedAt = new Date();
  await okrs.updateOne({ _id: new ObjectId(params.okrId) }, { $set: data });
  const updated = await okrs.findOne({ _id: new ObjectId(params.okrId) });
  return NextResponse.json(updated);
}

// DELETE /api/okrs/:okrId - Archive (soft delete) OKR
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  const okr = await okrs.findOne({ _id: new ObjectId(params.okrId) });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }
  // Soft delete: set status to 'archived'
  await okrs.updateOne({ _id: new ObjectId(params.okrId) }, { $set: { status: "archived", updatedAt: new Date() } });
  return NextResponse.json({ success: true });
}
