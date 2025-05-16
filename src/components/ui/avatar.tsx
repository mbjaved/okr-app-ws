// Avatar component for consistent user image display
// Best Practice: Reusable, accessible, typed component
import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
};

export const Avatar: React.FC<AvatarProps & { username?: string }> = ({ src, username, alt, size = "sm", className = "" }) => {
  // Prefer explicit src, then username-based SVG, then fallback default
  let avatarSrc = src;
  if (!avatarSrc && username) {
    avatarSrc = `/avatars/${username}.svg`;
  }
  if (!avatarSrc) {
    avatarSrc = "/avatars/default.svg";
  }
  return (
    <img
      src={avatarSrc}
      alt={alt || "User avatar"}
      className={`rounded-full object-cover border border-gray-200 bg-gray-100 ${sizeMap[size]} ${className}`}
      loading="lazy"
      width={size === "sm" ? 32 : size === "md" ? 48 : 80}
      height={size === "sm" ? 32 : size === "md" ? 48 : 80}
    />
  );
};
