// Badge component for displaying user roles and status
// Best Practice: Reusable, accessible, typed component
import React from "react";

interface BadgeProps {
  color?: "green" | "gray" | 'default' | 'success' | 'warning' | 'danger' | 'destructive' | 'outline' | string;
  children: React.ReactNode;
  className?: string;
}

const colorMap: Record<string, string> = {
  // Standard colors
  green: "bg-green-100 text-green-800 border-green-300",
  gray: "bg-gray-100 text-gray-800 border-gray-300",
  // Extended variants for status indicators
  default: "bg-gray-100 text-gray-800 border-gray-300",
  success: "bg-green-100 text-green-800 border-green-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  danger: "bg-red-100 text-red-800 border-red-300",
  destructive: "bg-red-100 text-red-800 border-red-300",
  outline: "bg-white text-gray-800 border-gray-300",
};

export const Badge: React.FC<BadgeProps> = ({ color = "gray", children, className = "" }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${colorMap[color] || colorMap.gray} ${className}`}
    aria-label={typeof children === "string" ? children : undefined}
  >
    {children}
  </span>
);
