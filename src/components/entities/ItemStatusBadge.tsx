import clsx from "clsx";

export const ItemStatusBadge = ({ status }: { status?: string | null }) => {
  const normalized = status || "unknown";
  return <span className={clsx("entity-badge", normalized === "active" && "entity-badge--active")}>{normalized}</span>;
};
