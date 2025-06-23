import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface OkrContext {
  params: { okrId: string };
}
interface KeyResultPercent {
  krId: string;
  title: string;
  type: 'percent';
  progress: number;
  assignedTo?: string[];
}
interface KeyResultTarget {
  krId: string;
  title: string;
  type: 'target';
  current: number;
  target: number;
  unit?: string;
  assignedTo?: string[];
}
type KeyResult = KeyResultPercent | KeyResultTarget;
interface OwnerData {
  _id: string;
  name?: string;
  avatarUrl?: string;
}

interface OkrUpdatePayload {
  objective?: string;
  description?: string;
  category?: "Individual" | "Team";
  owners?: OwnerData[];
  startDate?: string;
  endDate?: string;
  keyResults?: KeyResult[];
}

// Helper: Get userId from session
async function getUserId() {
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

// GET /api/okrs/:okrId - Get single OKR
// Best_Practices.md: Typed API contracts for Next.js Route Handlers
// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  if (!params || !params.okrId || typeof params.okrId !== 'string') {
    return NextResponse.json({ error: "Invalid OKR ID" }, { status: 400 });
  }
  let okrObjectId;
  try {
    okrObjectId = new ObjectId(params.okrId);
  } catch (e) {
    return NextResponse.json({ error: "Malformed OKR ID" }, { status: 400 });
  }
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  const okr = await okrs.findOne({ _id: okrObjectId });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(okr);
}

// PUT /api/okrs/:okrId - Update OKR
export async function PUT(req: NextRequest, context: any) {
  const { params } = context;
  if (!params || !params.okrId || typeof params.okrId !== 'string') {
    return NextResponse.json({ error: "Invalid OKR ID" }, { status: 400 });
  }
  let okrObjectId;
  try {
    okrObjectId = new ObjectId(params.okrId);
  } catch (e) {
    return NextResponse.json({ error: "Malformed OKR ID" }, { status: 400 });
  }
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  let data;
  try {
    data = await req.json();
  } catch (err) {
    console.error("[OKR PUT] Invalid JSON payload", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  // Only allow update if user owns the OKR or is a department manager (future extension)
  const okr = await okrs.findOne({ _id: okrObjectId });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }
  // Remove _id from update payload to avoid immutable field error
  if ('_id' in data) delete data._id;

  // Validate and sanitize fields
  const update: any = {};
  if (typeof data.objective === 'string' && data.objective.trim()) update.objective = data.objective.trim();
  if (typeof data.description === 'string') update.description = data.description;
  if (typeof data.category === 'string' && ['Individual', 'Team'].includes(data.category)) update.category = data.category;
  
  // Handle owners array - support both legacy string[] and new object[] formats
  if (Array.isArray(data.owners) && data.owners.length > 0) {
    if (typeof data.owners[0] === 'string') {
      // Legacy format: just IDs
      update.owners = data.owners.map((id: string) => ({ _id: id }));
    } else if (typeof data.owners[0] === 'object') {
      // New format: objects with _id, name, avatarUrl
      update.owners = data.owners.filter((owner: any) => 
        owner && typeof owner === 'object' && owner._id
      ).map((owner: any) => ({
        _id: owner._id,
        name: owner.name || undefined,
        avatarUrl: owner.avatarUrl || undefined
      }));
    }
  }
  
  if (typeof data.startDate === 'string' && data.startDate) update.startDate = data.startDate;
  if (typeof data.endDate === 'string' && data.endDate) update.endDate = data.endDate;
  if (Array.isArray(data.keyResults)) update.keyResults = data.keyResults;
  // Allow status update (Best_Practices.md: Typed API contracts, robust payloads)
  if (typeof data.status === 'string' && ['active', 'archived', 'on_track', 'off_track', 'at_risk', 'completed', 'deleted'].includes(data.status)) {
    update.status = data.status;
    console.log('[OKR PUT] Status update:', data.status);
  }
  update.updatedAt = new Date();

  // Debug log
  console.log('[OKR PUT] Update payload:', update);

  try {
    const result = await okrs.updateOne({ _id: okrObjectId }, { $set: update });
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No changes made to OKR." }, { status: 400 });
    }
    const updated = await okrs.findOne({ _id: okrObjectId });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[OKR PUT] Update failed', err);
    return NextResponse.json({ error: "Failed to update OKR. Please check your input and try again." }, { status: 500 });
  }
}

// DELETE /api/okrs/:okrId - Archive (soft delete) or Hard Delete OKR
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context;
  if (!params || !params.okrId || typeof params.okrId !== 'string') {
    return NextResponse.json({ error: "Invalid OKR ID" }, { status: 400 });
  }
  let okrObjectId;
  try {
    okrObjectId = new ObjectId(params.okrId);
  } catch (e) {
    return NextResponse.json({ error: "Malformed OKR ID" }, { status: 400 });
  }
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getCollection("okrs");
  const okr = await okrs.findOne({ _id: okrObjectId });
  if (!okr || (okr.userId?.toString() !== userId.toString() && (!okr.departmentId))) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
  }

  const url = new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`);
  const hardDelete = url.searchParams.get('hard') === 'true';

  if (hardDelete) {
    // Only allow hard delete if already deleted
    if (okr.status !== 'deleted') {
      return NextResponse.json({ error: 'OKR must be soft deleted before hard deletion.' }, { status: 400 });
    }
    const result = await okrs.deleteOne({ _id: okrObjectId });
    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true, message: 'OKR permanently deleted.' });
    } else {
      return NextResponse.json({ error: 'Failed to hard delete OKR.' }, { status: 500 });
    }
  } else {
    // Soft delete: set status to 'deleted'
    if (okr.status === 'deleted') {
      return NextResponse.json({ success: true, message: 'OKR already deleted.' });
    }
    await okrs.updateOne({ _id: okrObjectId }, { $set: { status: "deleted", updatedAt: new Date() } });
    return NextResponse.json({ success: true, message: 'OKR deleted (soft).' });
  }
}
