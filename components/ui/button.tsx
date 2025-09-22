import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition rounded-xl";
    const variants = {
      default: "bg-teal-600 text-white hover:bg-teal-700",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    } as const;
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-3 text-base" } as const;
    return (
      <button ref={ref} className={[base, variants[variant], sizes[size], className].join(" ")} {...props} />
    );
  }
);
Button.displayName = "Button";
