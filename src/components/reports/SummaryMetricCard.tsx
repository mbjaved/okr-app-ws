// src/components/reports/SummaryMetricCard.tsx
// A simple, reusable card for summary metrics (e.g., total OKRs, completion rate)
import React from "react";
import { Card, CardHeader, CardContent } from "../ui/card";

interface SummaryMetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  colorClass?: string; // e.g. 'text-blue-600'
  description?: string;
  className?: string;
}

export const SummaryMetricCard: React.FC<SummaryMetricCardProps> = ({
  title,
  value,
  icon,
  colorClass = "text-blue-600",
  description,
  className = "",
  onClick,
  role,
  tabIndex,
}) => {
  const isClickable = typeof onClick === 'function';
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isClickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <Card
      className={`flex flex-col items-center justify-center p-4 min-w-[140px] min-h-[120px] ${isClickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      aria-pressed={isClickable ? undefined : undefined}
    >
      <CardHeader className="flex flex-col items-center justify-center gap-2">
        {icon && <span className={`text-3xl ${colorClass}`}>{icon}</span>}
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide text-center">{title}</span>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-1">
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
        {description && <span className="text-xs text-gray-400 text-center">{description}</span>}
      </CardContent>
    </Card>
  );
};
