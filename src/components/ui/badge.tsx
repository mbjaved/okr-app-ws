// Badge component for displaying user roles and status
// Best Practice: Reusable, accessible, typed component
import React from "react";

interface BadgeProps {
  color?: "green" | "gray" | string;
  children: React.ReactNode;
  className?: string;
}

const colorMap: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  gray: "bg-gray-100 text-gray-800 border-gray-300",
};

export const Badge: React.FC<BadgeProps> = ({ color = "gray", children, className = "" }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${colorMap[color] || colorMap.gray} ${className}`}
    aria-label={typeof children === "string" ? children : undefined}
  >
    {children}
  </span>
);
