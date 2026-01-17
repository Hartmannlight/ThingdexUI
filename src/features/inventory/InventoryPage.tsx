import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/Card";
import { LocationTree } from "@/components/LocationTree";
import { StatusBanner } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { getLocation, getPath, listItemsInLocation } from "@/api/locations";
import { listItemTypes } from "@/api/itemTypes";
import { getRuntimeConfig } from "@/config/runtime";
import { parseErrorMessage } from "@/api/errors";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const InventoryPage = () => {
  const config = getRuntimeConfig();
  const { featureFlags } = config;
  const rootLocationId = useBootstrapRootLocation();
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [includeDescendants, setIncludeDescendants] = useState(config.defaults.includeDescendants);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  useEffect(() => {
    if (rootLocationId) {
      setSelectedLocationId(rootLocationId);
    }
  }, [rootLocationId]);

  const locationQuery = useQuery({
    queryKey: ["location", selectedLocationId],
    queryFn: () => getLocation(selectedLocationId),
    enabled: !!selectedLocationId
  });

  const pathQuery = useQuery({
    queryKey: ["location", selectedLocationId, "path"],
    queryFn: () => getPath(selectedLocationId),
    enabled: !!selectedLocationId
  });

  const itemsQuery = useQuery({
    queryKey: ["location", selectedLocationId, "items", includeDescendants, includeDeleted],
    queryFn: () => listItemsInLocation(selectedLocationId, includeDescendants, { include_deleted: includeDeleted }),
    enabled: !!selectedLocationId
  });

  const itemTypesQuery = useQuery({
    queryKey: ["item-types", includeDeleted],
    queryFn: () => listItemTypes({ include_deleted: includeDeleted }),
    enabled: featureFlags.inventory
  });

  const itemCount = itemsQuery.data?.length ?? 0;
  const locationName = locationQuery.data?.name ?? selectedLocationId;

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Inventory browsing is disabled." />
      </div>
    );
  }

  const pageStatus = useMemo(() => {
    if (itemsQuery.isError) return { kind: "error", title: "Items failed", message: parseErrorMessage(itemsQuery.error) };
    if (locationQuery.isError)
      return { kind: "error", title: "Location failed", message: parseErrorMessage(locationQuery.error) };
    return null;
  }, [itemsQuery.error, itemsQuery.isError, locationQuery.error, locationQuery.isError]);

  const typeNameMap = useMemo(() => {
    return new Map((itemTypesQuery.data ?? []).map((type) => [type.id, type.name]));
  }, [itemTypesQuery.data]);

  if (!rootLocationId) {
    return (
      <div className="page">
        <StatusBanner kind="info" title="Bootstrapping root location" message="Fetching root location..." />
      </div>
    );
  }

  return (
    <div className="page">
      {pageStatus && <StatusBanner kind={pageStatus.kind} title={pageStatus.title} message={pageStatus.message} />}
      <div className="inventory">
        <Card className="inventory__tree">
          <div className="card__header">
            <h3>Location Tree</h3>
          </div>
          <LocationTree
            rootId={rootLocationId}
            selectedId={selectedLocationId}
            onSelect={(id) => setSelectedLocationId(id)}
            includeDeleted={includeDeleted}
          />
        </Card>

        <Card className="inventory__items">
          <div className="card__header">
            <div>
              <h3>{locationName}</h3>
              {pathQuery.data && <Breadcrumbs path={pathQuery.data} />}
            </div>
            <div className="toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeDescendants}
                  onChange={(event) => setIncludeDescendants(event.target.checked)}
                />
                <span>Include descendants</span>
                <HelpIcon text="Also include items stored in nested child locations under the selected node." />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) => setIncludeDeleted(event.target.checked)}
                />
                <span>Include deleted</span>
              </label>
            </div>
          </div>
          {selectedLocationId && <div className="muted">Location ID: {selectedLocationId}</div>}
          <div className="inventory__summary">{itemCount} items</div>
          <div className="inventory__list">
            {itemsQuery.isLoading && <div className="empty">Loading items...</div>}
            {!itemsQuery.isLoading && itemCount === 0 && <div className="empty">No items in this location.</div>}
            {itemsQuery.data?.map((item) => (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="item-row">
                <div className="item-row__title">{typeNameMap.get(item.type_id) ?? "Item"}</div>
                <div className="item-row__meta">{item.status ?? "stored"}</div>
                <div className="item-row__meta">{item.location_id ? "Stored" : "In use"}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InventoryPage;
