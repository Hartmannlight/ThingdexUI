import clsx from "clsx";
import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { HelpIcon } from "@/components/HelpIcon";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  size?: "sm" | "md" | "lg";
  help?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ size = "md", className, help, ...props }, ref) => {
  const select = <select ref={ref} className={clsx("select", `select--${size}`, className)} {...props} />;
  if (!help) return select;
  return (
    <div className="field-with-help">
      {select}
      <HelpIcon text={help} />
    </div>
  );
});

Select.displayName = "Select";
