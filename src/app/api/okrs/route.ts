import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { createOKR } from "@/lib/okr-model";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper: Get userId from session
async function getUserId(req: NextRequest) {
  try {
    console.log('Getting user session...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('No session found');
      return null;
    }
    
    if (!session.user?.email) {
      console.error('No email found in session');
      return null;
    }
    
    console.log('Session found for email:', session.user.email);
    
    // Find user by email
    const users = await getCollection("users");
    if (!users) {
      console.error('Failed to get users collection');
      return null;
    }
    
    const user = await users.findOne({ email: session.user.email });
    if (!user) {
      console.error('No user found with email:', session.user.email);
      return null;
    }
    
    console.log('User found in database with ID:', user._id);
    return user._id;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  }
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

  // Activity logging for dashboard
  const activities = await getCollection("activities");
  await activities.insertOne({
    userId,
    okrId: result.insertedId,
    type: "OKR Created",
    createdAt: new Date(),
    details: {
      objective: data.objective,
      description: data.description,
      status: data.status,
      endDate: data.endDate,
      departmentId: data.departmentId || null
    }
  });

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
