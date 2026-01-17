import clsx from "clsx";
import { forwardRef } from "react";
import type { FocusEvent, InputHTMLAttributes } from "react";
import { HelpIcon } from "@/components/HelpIcon";
import { useUuidLookup } from "@/hooks/useUuidLookup";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  size?: "sm" | "md" | "lg";
  help?: string;
  resolveUuid?: boolean;
};

const uuidFocusRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", className, help, resolveUuid = true, onFocus, ...props }, ref) => {
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

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      if (event.defaultPrevented) return;
      if (uuidFocusRegex.test(event.currentTarget.value)) {
        event.currentTarget.select();
      }
    };

    return (
      <div className="field-stack">
        {help ? (
          <div className="field-with-help">
            <input
              ref={ref}
              className={clsx("input", `input--${size}`, className)}
              onFocus={handleFocus}
              {...props}
            />
            <HelpIcon text={help} />
          </div>
        ) : (
          <input
            ref={ref}
            className={clsx("input", `input--${size}`, className)}
            onFocus={handleFocus}
            {...props}
          />
        )}
        {hint && <div className={clsx("uuid-hint", lookup.status === "error" && "uuid-hint--error")}>{hint}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";
