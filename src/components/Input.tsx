import clsx from "clsx";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { HelpIcon } from "@/components/HelpIcon";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  size?: "sm" | "md" | "lg";
  help?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ size = "md", className, help, ...props }, ref) => {
  const input = <input ref={ref} className={clsx("input", `input--${size}`, className)} {...props} />;
  if (!help) return input;
  return (
    <div className="field-with-help">
      {input}
      <HelpIcon text={help} />
    </div>
  );
});

Input.displayName = "Input";
