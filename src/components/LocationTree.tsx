import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocation, listChildren } from "@/api/locations";
import type { LocationOut } from "@/api/types";

export type LocationTreeProps = {
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const LocationNode = ({
  nodeId,
  depth,
  selectedId,
  onSelect
}: {
  nodeId: string;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const locationQuery = useQuery({
    queryKey: ["location", nodeId],
    queryFn: () => getLocation(nodeId)
  });
  const childrenQuery = useQuery({
    queryKey: ["location", nodeId, "children"],
    queryFn: () => listChildren(nodeId),
    enabled: expanded
  });

  const location = locationQuery.data as LocationOut | undefined;
  const children = (childrenQuery.data ?? []) as LocationOut[];

  return (
    <div className="location-node" style={{ paddingLeft: depth * 14 }}>
      <div className={selectedId === nodeId ? "location-node__row is-active" : "location-node__row"}>
        <button
          className="location-node__toggle"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "-" : "+"}
        </button>
        <button className="location-node__label" onClick={() => onSelect(nodeId)} type="button">
          {location?.name ?? nodeId}
        </button>
      </div>
      {expanded && children.length > 0 && (
        <div className="location-node__children">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              nodeId={child.id}
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

export const LocationTree = ({ rootId, selectedId, onSelect }: LocationTreeProps) => {
  return (
    <div className="location-tree">
      <LocationNode nodeId={rootId} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
};
