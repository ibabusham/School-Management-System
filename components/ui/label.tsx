/**
 * Form field label.
 *
 * Renders a <label> with consistent typography. Pair with Input/Select
 * using the htmlFor prop matching the input's id.
 */
import { type LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1 block text-sm font-medium text-foreground-secondary ${className}`}
      {...props}
    />
  );
}
