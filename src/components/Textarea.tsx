import clsx from "clsx";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { HelpIcon } from "@/components/HelpIcon";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  mono?: boolean;
  help?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ mono = false, className, help, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        className={clsx("textarea", mono && "textarea--mono", className)}
        {...props}
      />
    );
    if (!help) return textarea;
    return (
      <div className="field-with-help">
        {textarea}
        <HelpIcon text={help} />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
