// src/components/ui/button.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = ["primary", "secondary", "danger", "outline"] as const;
type ButtonVariant = (typeof buttonVariants)[number];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className = "",
    variant = "primary",
    size = "md",
    disabled = false,
    isLoading = false,
    children,
    ...props
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:shadow-md active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none";
    
    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground"
    };

    const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 py-2 px-4',
  lg: 'h-12 px-6 text-lg',
};

    const buttonClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size || 'md'],
      className,
      {
        "opacity-50 cursor-not-allowed": disabled || isLoading,
        "cursor-not-allowed opacity-50": isLoading
      }
    );



    return (
      <button
        ref={ref}
        className={buttonClassName}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
