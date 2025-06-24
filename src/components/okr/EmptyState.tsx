// EmptyState.tsx
// Best Practices: Modular, accessible, design prompt reference
import React from "react";

interface EmptyStateProps {
  svg: React.ReactNode;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ svg, message }) => (
  <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
    <div className="mb-4">{svg}</div>
    <div className="text-gray-400">{message}</div>
  </div>
);
