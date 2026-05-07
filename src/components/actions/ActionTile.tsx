import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ActionTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  detail?: string;
  mark: ReactNode;
  tone?: "default" | "primary" | "danger" | "warning";
};

export const ActionTile = ({ title, detail, mark, tone = "default", className, ...props }: ActionTileProps) => (
  <button type="button" className={clsx("action-tile", `action-tile--${tone}`, className)} {...props}>
    <span className="action-tile__mark">{mark}</span>
    <span>
      <span className="action-tile__title">{title}</span>
      {detail && <span className="action-tile__detail">{detail}</span>}
    </span>
  </button>
);
