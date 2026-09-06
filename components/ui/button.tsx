/**
 * Reusable button with consistent styling across the app.
 *
 * Wraps a native <button> and applies Tailwind classes based on the
 * chosen variant. All standard button props (onClick, disabled, etc.)
 * are forwarded via ...props.
 */
import { type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style — defaults to primary (red brand color). */
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-muted shadow-sm",
  secondary:
    "bg-surface text-foreground-secondary border border-border hover:bg-background",
  ghost: "bg-transparent text-foreground-secondary hover:bg-background",
  // outline is tuned for the dark sidebar (logout button)
  outline:
    "border border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
