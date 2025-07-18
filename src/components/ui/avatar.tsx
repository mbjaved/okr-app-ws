"use client";
// Avatar component for consistent user image display
// Best Practice: Reusable, accessible, typed component
import React, { useState } from "react";

import { mapUserToAvatarData, UserLike } from "@/lib/mapUserToAvatarData";

interface AvatarProps {
  user?: UserLike;
  src?: string;
  username?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  title?: string;
  bgColor?: string;
  textColor?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 text-lg",
  xl: "w-36 h-36 text-3xl",
};

// Generate initials from a name (take first letter of each word, max 2)
const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  // Handle MongoDB ObjectId-like usernames (e.g., 6a0368451d1)
  if (/^[0-9a-f]+$/i.test(name)) {
    // For hex strings like MongoDB IDs, use 'U' for User
    return 'U';
  }
  
  // If name has no spaces (like a username), take first 2 letters if it's at least 2 chars
  if (!name.includes(' ') && name.length >= 2) {
    // Extract only letters for cleaner initials
    const letters = name.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 2) {
      return letters.substring(0, 2).toUpperCase();
    }
    // If not enough letters, use first character and add '?'
    return (letters.charAt(0) || '?').toUpperCase();
  }
  
  // Normal case: get first letter of each word
  const initials = name
    .split(' ')
    .map(part => {
      // Extract only the first letter if it's alphabetic
      const firstChar = part.charAt(0).toUpperCase();
      return /[A-Z]/.test(firstChar) ? firstChar : '';
    })
    .filter(Boolean) // Remove empty strings
    .slice(0, 2)
    .join('');
  
  return initials || '?';
};

// Generate a consistent color based on a string
const stringToColor = (str?: string): string => {
  if (!str) return '#6366f1'; // Indigo default
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate color in HSL for better contrast
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const Avatar: React.FC<AvatarProps> = ({
  user,
  src,
  username,
  alt,
  size = "sm",
  className = "",
  title,
  bgColor,
  textColor,
}) => {
  const [imgError, setImgError] = useState(false);
  // Prefer user prop for all data
  const { name, avatarUrl, initials } = mapUserToAvatarData(
    user || { name: username, avatarUrl: src }
  );
  const avatarSrc = !imgError ? (avatarUrl || src) : undefined;
  const displayName = alt || name || "User";
  const handleError = () => setImgError(true);

  if (!avatarSrc || imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full border border-gray-200 ${sizeMap[size]} ${className}`}
        style={{ backgroundColor: bgColor || "#6366f1" }}
        role="img"
        aria-label={`Avatar for ${displayName}`}
        title={title || displayName}
      >
        <span style={{ color: textColor || "#ffffff" }} className="font-medium">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={avatarSrc}
      alt={alt || `Avatar for ${displayName}`}
      className={`rounded-full object-cover border border-gray-200 ${sizeMap[size]} ${className}`}
      loading="lazy"
      width={size === "sm" ? 32 : size === "md" ? 48 : 80}
      height={size === "sm" ? 32 : size === "md" ? 48 : 80}
      onError={handleError}
      title={title || displayName}
    />
  );
};

export default Avatar;
