import type { LocationPathItem } from "@/api/types";
import { locationPath } from "@/utils/entityLabels";

export const LocationPathBreadcrumb = ({ path }: { path?: LocationPathItem[] | null }) => (
  <span className="path-text">{locationPath(path)}</span>
);
