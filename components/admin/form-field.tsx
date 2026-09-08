/**
 * Label + input wrapper for admin/teacher forms.
 *
 * Combines Label and a spacing wrapper so every form field
 * has consistent vertical rhythm. Pass the input as children.
 *
 * @example
 * <FormField label="Email" htmlFor="email">
 *   <Input id="email" type="email" />
 * </FormField>
 */
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
