import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { createOKR, OKR } from "@/lib/okr-model";

interface OwnerData {
  _id: string;
  name?: string;
  avatarUrl?: string;
}
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
  // Validate category and owners
  if (!data.category || !['Individual', 'Team'].includes(data.category)) {
    return NextResponse.json({ error: "Category must be 'Individual' or 'Team'" }, { status: 400 });
  }
  
  // Validate owners - can be either string[] or object[] format
  if (!Array.isArray(data.owners) || data.owners.length === 0) {
    return NextResponse.json({ error: "At least one owner must be specified" }, { status: 400 });
  }
  
  // Normalize owners to object format
  const normalizedOwners = data.owners.map((owner: string | OwnerData) => {
    if (typeof owner === 'string') {
      // Convert string ID to minimal owner object
      return { _id: owner };
    } else if (typeof owner === 'object' && owner && owner._id) {
      // Keep minimal required fields
      return {
        _id: owner._id,
        name: owner.name || undefined,
        avatarUrl: owner.avatarUrl || undefined
      };
    }
    // Invalid format, use null for filtering
    return null;
  }).filter(Boolean); // Remove any null values
  
  if (normalizedOwners.length === 0) {
    return NextResponse.json({ error: "At least one valid owner must be specified" }, { status: 400 });
  }
  const okr: OKR = createOKR({
    userId,
    objective: data.objective,
    keyResults: data.keyResults,
    description: data.description,
    category: data.category,
    owners: normalizedOwners, // Use our normalized owner objects
    status: data.status,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
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
      category: data.category,
      owners: data.owners
    }
  });

  // Ensure _id is always a string for client compatibility (Best_Practices.md: typed API contracts, robust payloads)
  return NextResponse.json({ ...okr, _id: result.insertedId.toString() }, { status: 201 });
}

// GET /api/okrs - List OKRs (user/department)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  
  // Build visibility filter based on OKR type and ownership
  let filter: any = {};
  
  // Status filter (if provided)
  if (status) filter.status = status;
  
  // Category-based filtering
  if (category) {
    // If specific category requested, apply that filter
    if (["Individual", "Team"].includes(category)) {
      filter.category = category;
    }
  }
  
  // Visibility rules:
  // 1. All team OKRs are visible to everyone
  // 2. Individual OKRs are visible if:
  //    - The user created them (userId match)
  //    - OR the user is listed as an owner (in the owners array)
  const visibilityFilter = {
    $or: [
      { category: "Team" },                     // All team OKRs
      { userId: userId },                       // Individual OKRs created by user
      { owners: { $elemMatch: { _id: userId } } } // Individual OKRs where user is an owner
    ]
  };
  
  // Combine all filters
  filter = { ...filter, ...visibilityFilter };
  
  console.log('OKR filter:', JSON.stringify(filter, null, 2));
  
  const okrs = await getCollection("okrs");
  const users = await getCollection("users");
  
  // Get all OKRs matching our filter
  const result = await okrs.find(filter).toArray();
  console.log(`Found ${result.length} OKRs matching filter for user ${userId}`);
  
  // Enhance owner data with user details for display
  const populatedResult = await Promise.all(result.map(async (okr: any) => {
    // Process owners array if it exists
    if (okr.owners && Array.isArray(okr.owners)) {
      // Get all unique owner IDs
      const ownerIds = okr.owners
        .map((owner: any) => typeof owner === 'string' ? owner : (owner?._id || ''))
        .filter(Boolean);
        
      if (ownerIds.length > 0) {
        // Fetch all user details in a single query
        const ownerUsers = await users.find({ _id: { $in: ownerIds } }).toArray();
        
        // Map owners with full user details
        okr.owners = ownerIds.map((ownerId: string) => {
          // Look for existing data
          const existingData = okr.owners.find((o: any) => 
            (typeof o === 'object' && o?._id === ownerId) ||
            (typeof o === 'string' && o === ownerId)
          );
          
          // Find user data for this owner
          const userData = ownerUsers.find((u: any) => u._id === ownerId);
          
          // Create enhanced owner object
          return {
            _id: ownerId,
            // Use userData name/avatarUrl if available, or existing data if present
            name: userData?.name || (typeof existingData === 'object' ? existingData.name : undefined),
            avatarUrl: userData?.avatarUrl || (typeof existingData === 'object' ? existingData.avatarUrl : undefined)
          };
        });
      }
    } else if (okr.owner && !okr.owners) {
      // Handle legacy single owner field - convert to owners array format
      const ownerId = okr.owner;
      const userData = await users.findOne({ _id: ownerId });
      
      // Create owners array with the single owner
      okr.owners = [{
        _id: ownerId,
        name: userData?.name,
        avatarUrl: userData?.avatarUrl
      }];
    }
    
    return okr;
  }));
  
  return NextResponse.json(populatedResult);
}
