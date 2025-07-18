import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface NotificationContext {
  params?: any;
}

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest, context: NotificationContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const users = await getCollection("users");
    const currentUser = await users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = currentUser._id.toString();

    // Get notifications for this user
    const notifications = await getCollection("notifications");
    const userNotifications = await notifications.find({ 
      userId: userId,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 }).limit(50).toArray();

    // Get unread count
    const unreadCount = await notifications.countDocuments({
      userId: userId,
      isRead: false,
      isDeleted: { $ne: true }
    });

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest, context: NotificationContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const users = await getCollection("users");
    const currentUser = await users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = currentUser._id.toString();
    const { notificationIds } = await request.json();

    // Mark notifications as read
    const notifications = await getCollection("notifications");
    
    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await notifications.updateMany(
        { 
          _id: { $in: notificationIds.map(id => new ObjectId(id)) },
          userId: userId 
        },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date() 
          } 
        }
      );
    } else {
      // Mark all notifications as read
      await notifications.updateMany(
        { userId: userId, isRead: false },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date() 
          } 
        }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
