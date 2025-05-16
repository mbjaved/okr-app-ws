import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { OKR, createOKR } from "@/lib/okr-model";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: Get userId from session
async function getUserId(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return null;
  // Find user by email
  const users = await getCollection("users");
  const user = await users.findOne({ email: session.user.email });
  return user?._id;
}

// POST /api/okrs - Create OKR
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  // Validate and create OKR
  const okr: OKR = createOKR({
    userId,
    objective: data.objective,
    keyResults: data.keyResults,
    description: data.description,
    status: data.status,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    departmentId: data.departmentId ? new ObjectId(data.departmentId) : undefined,
  });
  const okrs = await getCollection("okrs");
  const result = await okrs.insertOne(okr);
  return NextResponse.json({ ...okr, _id: result.insertedId }, { status: 201 });
}

// GET /api/okrs - List OKRs (user/department)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");
  const filter: any = {};
  if (departmentId) {
    filter.departmentId = new ObjectId(departmentId);
  } else {
    filter.userId = userId;
  }
  if (status) filter.status = status;
  const okrs = await getCollection("okrs");
  const result = await okrs.find(filter).toArray();
  return NextResponse.json(result);
}
