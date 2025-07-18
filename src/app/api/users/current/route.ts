// API Route: /api/users/current - Returns the current session user for SSR permission logic
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Best_Practices.md: Use 'context: any' for Next.js App Router API handlers to avoid type constraint errors
export async function GET(req: NextRequest, context: any) {
  try {
    // Get session using NextAuth.js
    const session = await getServerSession(authOptions);
    
    // Debug: Log session details
    console.log('[API USERS CURRENT] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
      userId: session?.user?.id,
      sessionUserId: (session?.user as any)?._id
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No session user found" }, { status: 401 });
    }

    // Find user in database by email
    const usersCol = await getCollection("users");
    const user = await usersCol.findOne({ 
      email: { $regex: new RegExp(`^${session.user.email}$`, 'i') }
    });
    
    console.log('[API USERS CURRENT] User lookup result:', {
      searchEmail: session.user.email,
      foundUser: !!user,
      userId: user?._id
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      avatarUrl: user.avatarUrl,
      role: user.role,
      department: user.department
    });
  } catch (error) {
    console.error('[API USERS CURRENT] Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
