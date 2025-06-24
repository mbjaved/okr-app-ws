import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';

import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * GET /api/dashboard
 * Fetches dashboard data for the authenticated user
 */
export async function GET() {
  console.log('🔍 Dashboard API called');
  console.log('Environment:', process.env.NODE_ENV);
  
  try {
    // Get user session
    console.log('🔑 Getting server session...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('❌ No session found');
      return NextResponse.json(
        { error: 'Not authenticated - No session' },
        { status: 401 }
      );
    }
    
    console.log('🔑 Session data:', {
      hasSession: true,
      userEmail: session.user?.email,
      userId: session.user?.id,
      userRole: session.user?.role
    });
    
    if (!session.user?.email) {
      console.error('❌ No email in session');
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 401 }
      );
    }

    // Connect to database
    console.log('🔗 Connecting to database...');
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
      console.log('✅ Connected to database');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    const userEmail = session.user.email;

    // Get user data
    console.log('🔍 Fetching user data for email:', userEmail);
    let user;
    try {
      user = await db.collection('users').findOne(
        { email: userEmail },
        { projection: { _id: 1, name: 1, department: 1, role: 1 } }
      );
      
      console.log('👤 User data from DB:', JSON.stringify(user, null, 2));
      
      if (!user) {
        console.error('❌ User not found for email:', userEmail);
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }
    } catch (userError) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json(
        { 
          error: 'Error fetching user data',
          details: userError instanceof Error ? userError.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? (userError as Error).stack : undefined
        },
        { status: 500 }
      );
    }

    // Get user's OKRs (match /api/okrs logic)
    console.log('🔍 Fetching OKRs for user:', user._id);
    interface KeyResult {
  title: string;
  type: "percent" | "target";
  progress?: number;
  current?: number;
  target?: number;
  unit?: string;
}

interface TeamMember {
  userId: string | ObjectId;
  name?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

interface Okr {
  _id: string | ObjectId;
  userId: string | ObjectId;
  objective: string;
  description?: string;
  keyResults?: KeyResult[];
  departmentId?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
let okrs: Okr[] = [];
    try {
      const okrsQuery: { userId: string | ObjectId; status?: string | Record<string, unknown> } = { userId: user._id };
      // If you want to support departmentId, you can extend this logic here
      okrsQuery.status = { $ne: 'archived' };
      console.log('🔍 OKRs query (dashboard, matching /api/okrs):', JSON.stringify(okrsQuery, null, 2));
      okrs = await db.collection<Okr>('okrs')
        .find(okrsQuery)
        .sort({ dueDate: 1 })
        .toArray(); // Do NOT limit for stats
      console.log(`✅ Found ${okrs.length} OKRs for user (dashboard)`);
    } catch (okrError) {
      console.error('❌ Error fetching OKRs:', okrError);
      okrs = [];
    }

    // Calculate OKR stats
    const okrsWithComputedStatus = okrs.map(okr => {
  // If keyResults exist and all are 100% (percent) or current >= target (target), treat as completed
  if (okr.keyResults && okr.keyResults.length > 0) {
    const allDone = okr.keyResults.every(kr => {
      if (kr.type === 'percent') {
        return (typeof kr.progress === 'number' && kr.progress >= 100);
      } else if (kr.type === 'target') {
        return (typeof kr.current === 'number' && typeof kr.target === 'number' && kr.current >= kr.target);
      }
      return false;
    });
    return { ...okr, computedStatus: allDone ? 'completed' : okr.status };
  }
  return { ...okr, computedStatus: okr.status };
});

const okrStats = {
  total: okrsWithComputedStatus.length,
  onTrack: okrsWithComputedStatus.filter(okr => okr.computedStatus === 'on_track').length,
  atRisk: okrsWithComputedStatus.filter(okr => okr.computedStatus === 'at_risk').length,
  offTrack: okrsWithComputedStatus.filter(okr => okr.computedStatus === 'off_track').length,
  completed: okrsWithComputedStatus.filter(okr => okr.computedStatus === 'completed').length
};
    
    console.log('📊 OKR Stats:', okrStats);

    // Get upcoming deadlines (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    console.log('📅 Fetching deadlines between', now, 'and', sevenDaysFromNow);

    // Support both endDate and dueDate for deadlines
    const deadlineQuery = {
      userId: user._id,
      status: { $nin: ['completed', 'archived'] },
      $or: [
        {
          endDate: {
            $gte: now,
            $lte: sevenDaysFromNow
          }
        },
        {
          dueDate: {
            $gte: now,
            $lte: sevenDaysFromNow
          }
        }
      ]
    };
    console.log('📅 Upcoming Deadlines Query:', JSON.stringify(deadlineQuery, null, 2));
    const upcomingDeadlines = await db.collection('okrs')
      .find(deadlineQuery)
      .sort({ endDate: 1, dueDate: 1 })
      .limit(5)
      .toArray();
    console.log('📅 Upcoming Deadlines Found:', upcomingDeadlines.length);

    // Format dates for the frontend
    const formatDate = (date: Date) => date ? new Date(date).toISOString() : null;
    
    const formattedUpcomingDeadlines = upcomingDeadlines.map(deadline => {
      // Pick the correct due date (endDate preferred, fallback to dueDate)
      const due = deadline.endDate || deadline.dueDate || null;
      const formattedDeadline = {
        _id: deadline._id?.toString(),
        objective: deadline.objective || '',
        status: deadline.status || '',
        dueDate: formatDate(due),
        createdAt: formatDate(deadline.createdAt),
        updatedAt: formatDate(deadline.updatedAt),
        teamMembers: deadline.teamMembers?.map((member: TeamMember) => ({
          ...member,
          userId: member.userId?.toString()
        })) || []
      };
      console.log('📅 Formatted deadline:', formattedDeadline);
      return formattedDeadline;
    });

    // Get recent activity (last 5 activities)
    const recentActivityRaw = await db.collection('activities')
      .find({
        $or: [
          { userId: user._id },
          { relatedUsers: user._id.toString() }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Map activities to frontend-friendly format
    interface Activity {
  type: string;
  details?: { objective?: string };
  createdAt: string | Date;
  userId?: string;
  user?: { name?: string; avatarUrl?: string };
  [key: string]: unknown;
}
const formattedRecentActivity = await Promise.all(
  recentActivityRaw.map(async (activity: Activity) => {
    let activityUser = null;
// ...
if (activity.userId) {
  let userIdObj = activity.userId;
  if (typeof activity.userId === 'string' && ObjectId.isValid(activity.userId)) {
    userIdObj = new ObjectId(activity.userId);
  }
  console.log('🔍 Fetching activity user for activity.userId:', activity.userId, 'as', userIdObj);
  activityUser = await db.collection('users').findOne(
    { _id: userIdObj },
    { projection: { name: 1, avatarUrl: 1 } }
  );
  console.log('👤 Activity user found:', activityUser);
}
    return {
      message: `${activity.type}${activity.details?.objective ? ': ' + activity.details.objective : ''}`,
      timestamp: activity.createdAt,
      user: activityUser
        ? {
            name: activityUser.name || 'Unknown',
            avatarUrl: activityUser.avatarUrl || null,
            _id: activityUser._id?.toString() || undefined
          }
        : { name: 'Unknown', avatarUrl: null },
    };
  })
);

    // Get team OKR status (if user is a manager/leader)
    let teamOkrStatus = null;
    if (user.role === 'manager' || user.role === 'admin') {
      const teamMembers = await db.collection('users').find({
        $or: [
          { managerId: user._id },
          { department: user.department }
        ],
        _id: { $ne: user._id }
      }).toArray();

      const teamMemberIds = teamMembers.map(member => member._id);
      
      const teamOkrs = await db.collection('okrs').find({
        ownerId: { $in: teamMemberIds },
        status: { $ne: 'archived' }
      }).toArray();

      teamOkrStatus = {
        total: teamOkrs.length,
        onTrack: teamOkrs.filter(okr => okr.status === 'on_track').length,
        atRisk: teamOkrs.filter(okr => okr.status === 'at_risk').length,
        offTrack: teamOkrs.filter(okr => okr.status === 'off_track').length,
        completed: teamOkrs.filter(okr => okr.status === 'completed').length
      };
    }

    const responseData = {
      okrStats,
      upcomingDeadlines: formattedUpcomingDeadlines,
      recentActivity: formattedRecentActivity,
      teamOkrStatus,
      user: {
        name: user.name,
        role: user.role,
        department: user.department
      }
    };
    
    console.log('✅ Sending response with data:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error details safely
    const errorDetails: Record<string, unknown> = {
      message: errorMessage,
      stack: errorStack
    };
    
    if (error && typeof error === 'object') {
      if ('name' in error) errorDetails.name = error.name;
      if ('code' in error) errorDetails.code = error.code;
      if ('status' in error) errorDetails.status = error.status;
    }
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
