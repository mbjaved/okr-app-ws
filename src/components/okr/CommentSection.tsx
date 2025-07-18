"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Avatar from '@/components/ui/avatar';
import { MultiSelect } from '@/components/ui/MultiSelect';
import Toast from '@/components/ui/Toast';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Comment {
  _id: string;
  okrId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface CommentSectionProps {
  okrId: string;
  currentUser: User | null;
  users: User[];
}

export function CommentSection({ okrId, currentUser, users }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; open: boolean }>({ message: '', type: 'info', open: false });

  // Use session user if currentUser is null
  const effectiveUser = currentUser || (session?.user ? {
    _id: (session.user as any)._id || session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    avatarUrl: (session.user as any).avatarUrl || session.user.image
  } : null);

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
  }, [okrId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/okrs/${okrId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/okrs/${okrId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const newCommentData = await response.json();
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      
      // Show success toast
      setToast({ message: 'Comment posted successfully', type: 'success', open: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
      setToast({ message: 'Failed to post comment', type: 'error', open: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    
    setNewComment(value);
    setCursorPosition(position);

    // Check for @ mentions
    const beforeCursor = value.substring(0, position);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const afterAt = beforeCursor.substring(atIndex + 1);
      if (!afterAt.includes(' ') && afterAt.length >= 0) {
        setMentionQuery(afterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: User) => {
    const beforeCursor = newComment.substring(0, cursorPosition);
    const afterCursor = newComment.substring(cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const beforeAt = beforeCursor.substring(0, atIndex);
      const mentionText = `@[${user.name}](${user._id})`;
      const newValue = beforeAt + mentionText + ' ' + afterCursor;
      
      setNewComment(newValue);
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const filteredUsers = users.filter(user => 
    effectiveUser && user._id !== effectiveUser._id && 
    (user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  const formatCommentContent = (content: string) => {
    // Replace @[Name](userId) with styled mentions
    return content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, name, userId) => {
      return `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${name}</span>`;
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading || status === 'loading') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800">Comments</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-800">
        Comments ({comments.length})
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Comment Form - Only show if user is authenticated */}
      {effectiveUser && status === 'authenticated' && (
        <Card className="p-4">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex space-x-3">
              <Avatar user={effectiveUser} size="sm" />
              <div className="flex-1 relative">
                <Input
                  value={newComment}
                  onChange={handleInputChange}
                  placeholder="Add a comment... Use @ to mention someone"
                  className="w-full cursor-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={isSubmitting}
                />
                
                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredUsers.slice(0, 5).map(user => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 active:bg-gray-100 text-left cursor-pointer transition-colors duration-150"
                      >
                        <Avatar user={user} size="sm" />
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Show login prompt if not authenticated */}
      {status === 'unauthenticated' && (
        <Card className="p-4">
          <div className="text-center text-gray-500">
            <p>Please <a href="/login" className="text-blue-600 hover:underline">sign in</a> to post comments.</p>
          </div>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <Card key={comment._id} className="p-4">
              <div className="flex space-x-3">
                <Avatar user={comment.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <div 
                    className="text-sm text-gray-700 break-words"
                    dangerouslySetInnerHTML={{ 
                      __html: formatCommentContent(comment.content) 
                    }}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      
      {/* Toast for notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        open={toast.open}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
