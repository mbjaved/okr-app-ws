// src/components/ui/card.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={
        "bg-white rounded-lg shadow-sm border border-gray-200 " + className
      }
      {...props}
    />
  )
);
Card.displayName = "Card";
