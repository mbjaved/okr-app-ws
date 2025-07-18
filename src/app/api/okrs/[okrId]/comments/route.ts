import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendMentionNotification } from "@/lib/email";

interface CommentContext {
  params: { okrId: string };
}

interface Comment {
  _id?: ObjectId;
  okrId: string;
  userId: string;
  content: string;
  mentions: string[]; // Array of user IDs mentioned in the comment
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

interface CommentWithUser extends Comment {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

// Helper: Get userId from session (reused from OKR route)
async function getUserId() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }
    
    const users = await getCollection("users");
    if (!users) {
      return null;
    }
    
    const user = await users.findOne({ email: session.user.email });
    return user?._id || null;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  }
}

// Helper: Enrich comments with user data
async function enrichCommentsWithUserData(comments: any[]): Promise<CommentWithUser[]> {
  const users = await getCollection("users");
  if (!users) return comments.map(c => ({ ...c, user: { _id: c.userId, name: 'Unknown User', email: '', avatarUrl: undefined } }));

  const userIds = [...new Set(comments.map(c => c.userId))];
  const userData = await users.find({ 
    _id: { $in: userIds.map(id => new ObjectId(id)) } 
  }).toArray();

  return comments.map(comment => {
    const foundUser = userData.find(u => u._id.toString() === comment.userId);
    return {
      ...comment,
      user: foundUser ? {
        _id: foundUser._id.toString(),
        name: foundUser.name || 'Unknown User',
        email: foundUser.email || '',
        avatarUrl: foundUser.avatarUrl || undefined
      } : {
        _id: comment.userId,
        name: 'Unknown User',
        email: '',
        avatarUrl: undefined
      }
    };
  });
}

// Helper: Extract mentions from comment content
function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // Extract user ID from @[Name](userId) format
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

// GET /api/okrs/:okrId/comments - Get all comments for an OKR
export async function GET(req: NextRequest, context: CommentContext) {
  const params = await context.params;
  
  if (!params?.okrId || typeof params.okrId !== 'string') {
    return NextResponse.json({ error: "Invalid OKR ID" }, { status: 400 });
  }

  let okrObjectId;
  try {
    okrObjectId = new ObjectId(params.okrId);
  } catch (e) {
    return NextResponse.json({ error: "Malformed OKR ID" }, { status: 400 });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify OKR exists and user has access
    const okrs = await getCollection("okrs");
    const okr = await okrs.findOne({ _id: okrObjectId });
    
    if (!okr) {
      return NextResponse.json({ error: "OKR not found" }, { status: 404 });
    }

    // Get comments for this OKR
    const comments = await getCollection("comments");
    const commentList = await comments.find({ 
      okrId: params.okrId,
      isDeleted: { $ne: true }
    }).sort({ createdAt: 1 }).toArray();

    // Enrich with user data
    const enrichedComments = await enrichCommentsWithUserData(commentList);

    return NextResponse.json(enrichedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/okrs/:okrId/comments - Create a new comment
export async function POST(req: NextRequest, context: CommentContext) {
  const params = await context.params;
  
  if (!params?.okrId || typeof params.okrId !== 'string') {
    return NextResponse.json({ error: "Invalid OKR ID" }, { status: 400 });
  }

  let okrObjectId;
  try {
    okrObjectId = new ObjectId(params.okrId);
  } catch (e) {
    return NextResponse.json({ error: "Malformed OKR ID" }, { status: 400 });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Verify OKR exists
    const okrs = await getCollection("okrs");
    const okr = await okrs.findOne({ _id: okrObjectId });
    
    if (!okr) {
      return NextResponse.json({ error: "OKR not found" }, { status: 404 });
    }

    // Extract mentions from content
    const mentions = extractMentions(content);

    // Create comment
    const comments = await getCollection("comments");
    const newComment: Comment = {
      okrId: params.okrId,
      userId: userId.toString(),
      content: content.trim(),
      mentions,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };

    const result = await comments.insertOne(newComment);
    const createdComment = await comments.findOne({ _id: result.insertedId });

    if (!createdComment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    // Enrich with user data
    const enrichedComments = await enrichCommentsWithUserData([createdComment]);
    const enrichedComment = enrichedComments[0];

    // Send email notifications to mentioned users
    if (mentions.length > 0) {
      try {
        const users = await getCollection("users");
        const mentionedUsers = await users.find({ 
          _id: { $in: mentions.map(id => new ObjectId(id)) } 
        }).toArray();

        const currentUser = await users.findOne({ _id: userId });
        const commenterName = currentUser?.name || currentUser?.email || 'Someone';

        // Create notification records and send emails
        const notifications = await getCollection("notifications");
        
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser._id.toString() !== userId.toString()) { // Don't notify self
            // Create notification record
            await notifications.insertOne({
              userId: mentionedUser._id.toString(),
              type: 'mention',
              title: `${commenterName} mentioned you in a comment`,
              message: `You were mentioned in a comment on "${okr.objective}"`,
              data: {
                okrId: params.okrId,
                okrTitle: okr.objective,
                commentId: result.insertedId.toString(),
                commentContent: content.trim(),
                commenterName,
                commenterId: userId.toString()
              },
              isRead: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Send email notification
            await sendMentionNotification({
              mentionedUserEmail: mentionedUser.email,
              mentionedUserName: mentionedUser.name || mentionedUser.email,
              commenterName,
              okrTitle: okr.objective,
              okrId: params.okrId,
              commentContent: content.trim()
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send mention notifications:', emailError);
        // Don't fail the comment creation if email fails
      }
    }

    return NextResponse.json(enrichedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
