import clsx from "clsx";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { HelpIcon } from "@/components/HelpIcon";
import { useUuidLookup } from "@/hooks/useUuidLookup";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  mono?: boolean;
  help?: string;
  resolveUuid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ mono = false, className, help, resolveUuid = true, ...props }, ref) => {
    const inputValue =
      typeof props.value === "string"
        ? props.value
        : typeof props.defaultValue === "string"
          ? props.defaultValue
          : "";
    const lookup = useUuidLookup(inputValue, resolveUuid);
    const hint =
      lookup.status === "loading"
        ? "Resolving UUID..."
        : lookup.status === "found"
          ? `${lookup.kind === "item" ? "Item" : "Location"}: ${lookup.label ?? "Unknown"}`
          : lookup.status === "not-found"
            ? "UUID detected, no item or location found."
            : lookup.status === "error"
              ? "UUID lookup failed."
              : null;

    return (
      <div className="field-stack">
        {help ? (
          <div className="field-with-help">
            <textarea
              ref={ref}
              className={clsx("textarea", mono && "textarea--mono", className)}
              {...props}
            />
            <HelpIcon text={help} />
          </div>
        ) : (
          <textarea
            ref={ref}
            className={clsx("textarea", mono && "textarea--mono", className)}
            {...props}
          />
        )}
        {hint && <div className={clsx("uuid-hint", lookup.status === "error" && "uuid-hint--error")}>{hint}</div>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
