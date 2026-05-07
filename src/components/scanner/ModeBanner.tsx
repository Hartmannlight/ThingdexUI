import type { ReactNode } from "react";
import clsx from "clsx";

export const ModeBanner = ({
  title,
  children,
  tone = "info"
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warning" | "danger";
}) => (
  <section className={clsx("mode-banner", `mode-banner--${tone}`)}>
    <div className="mode-banner__title">{title}</div>
    {children && <div className="mode-banner__body">{children}</div>}
  </section>
);
