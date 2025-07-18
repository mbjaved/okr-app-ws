"use client";

import React, { useState, useEffect } from 'react';
import { Menu, MenuItem } from './Menu';
import Avatar from './avatar';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: {
    okrId: string;
    okrTitle: string;
    commentId?: string;
    commentContent?: string;
    commenterName?: string;
    commenterId?: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);


  // Fetch notifications on component mount and periodically
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        if (notificationIds) {
          setNotifications(prev => 
            prev.map(notif => 
              notificationIds.includes(notif._id) 
                ? { ...notif, isRead: true }
                : notif
            )
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        } else {
          // Mark all as read
          setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead([notification._id]);
    }
    
    // Navigate to OKR details page
    if (notification.data.okrId) {
      window.location.href = `/okrs/${notification.data.okrTitle.toLowerCase().replace(/\s+/g, '-')}-${notification.data.okrId}`;
    }
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



  // Debug logging
  console.log('NotificationBell - about to render Menu with align="center"');
  
  const menuAlign = "center" as const;
  console.log('NotificationBell - menuAlign variable:', menuAlign);
  
  return (
    <div className={`relative ${className}`}>
      <Menu
        align={menuAlign}
        trigger={
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            {/* Bell Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            
            {/* Unread Count Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        }

      >
        <div className="w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors duration-150"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3 text-gray-400"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <MenuItem
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                    !notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar for commenter */}
                    {notification.data.commenterId && (
                      <Avatar
                        size="sm"
                        username={notification.data.commenterName}
                        className="flex-shrink-0 mt-0.5"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-5 ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 leading-5 break-words">
                        {notification.message}
                      </p>
                      
                      {notification.data.commentContent && (
                        <p className="text-xs text-gray-500 mt-2 italic leading-4 break-words bg-gray-50 px-2 py-1 rounded">
                          "{notification.data.commentContent}"
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </MenuItem>
              ))}
            </div>
          )}
        </div>
      </Menu>
    </div>
  );
}
