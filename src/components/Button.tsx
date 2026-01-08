import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

export const Button = ({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx("button", `button--${variant}`, `button--${size}`, block && "button--block", className)}
      {...props}
    />
  );
};
