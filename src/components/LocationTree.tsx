import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocationTree } from "@/api/locations";
import type { LocationTreeNode } from "@/api/types";
import { StatusBanner } from "@/components/StatusBanner";
import { parseErrorMessage } from "@/api/errors";

export type LocationTreeProps = {
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  includeDeleted?: boolean;
};

const LocationNode = ({
  node,
  depth,
  selectedId,
  onSelect
}: {
  node: LocationTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <div className="location-node" style={{ paddingLeft: depth * 14 }}>
      <div className={selectedId === node.id ? "location-node__row is-active" : "location-node__row"}>
        <button
          className="location-node__toggle"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          disabled={!hasChildren}
        >
          {hasChildren ? (expanded ? "-" : "+") : "•"}
        </button>
        <button className="location-node__label" onClick={() => onSelect(node.id)} type="button">
          {node.name ?? node.id}
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="location-node__children">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LocationTree = ({ rootId, selectedId, onSelect, includeDeleted = false }: LocationTreeProps) => {
  const treeQuery = useQuery({
    queryKey: ["location-tree", rootId, includeDeleted],
    queryFn: () => getLocationTree({ root_location_id: rootId, include_deleted: includeDeleted }),
    enabled: !!rootId
  });

  if (treeQuery.isLoading) {
    return <div className="empty">Loading location tree...</div>;
  }

  if (treeQuery.isError) {
    return <StatusBanner kind="error" title="Tree failed" message={parseErrorMessage(treeQuery.error)} />;
  }

  if (!treeQuery.data) {
    return <div className="empty">No tree data.</div>;
  }

  return (
    <div className="location-tree">
      <LocationNode node={treeQuery.data} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
};
