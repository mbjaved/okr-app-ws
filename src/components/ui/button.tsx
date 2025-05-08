// src/components/ui/button.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    let base = "px-4 py-2 rounded font-medium focus:outline-none transition-colors ";
    let styles = {
      primary: base + "bg-blue-600 text-white hover:bg-blue-700",
      secondary: base + "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50",
      danger: base + "bg-red-600 text-white hover:bg-red-700"
    };
    return (
      <button ref={ref} className={styles[variant] + " " + className} {...props} />
    );
  }
);
Button.displayName = "Button";
