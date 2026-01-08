import type { LocationPathItem } from "@/api/types";

export const Breadcrumbs = ({ path }: { path: LocationPathItem[] }) => {
  if (!path.length) return null;
  return (
    <div className="breadcrumbs">
      {path.map((node, index) => (
        <span key={node.id} className="breadcrumbs__item">
          {node.name}
          {index < path.length - 1 && <span className="breadcrumbs__sep">/</span>}
        </span>
      ))}
    </div>
  );
};
