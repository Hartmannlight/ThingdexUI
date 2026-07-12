import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/Card";
import { LocationTree } from "@/components/LocationTree";
import { StatusBanner, type StatusKind } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { getLocation, getPath, listItemsInLocation } from "@/api/locations";
import { listItemTypes } from "@/api/itemTypes";
import { getRuntimeConfig } from "@/config/runtime";
import { parseErrorMessage } from "@/api/errors";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";
import { Icon } from "@/components/Icon";

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

  const pageStatus = useMemo<{ kind: StatusKind; title: string; message: string } | null>(() => {
    if (itemsQuery.isError) return { kind: "error", title: "Items failed", message: parseErrorMessage(itemsQuery.error) };
    if (locationQuery.isError)
      return { kind: "error", title: "Location failed", message: parseErrorMessage(locationQuery.error) };
    return null;
  }, [itemsQuery.error, itemsQuery.isError, locationQuery.error, locationQuery.isError]) as
    | { kind: "success" | "warning" | "error" | "info"; title: string; message?: string }
    | null;

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
      <div className="section-heading">
        <div><div className="eyebrow">Lagerorte und Items</div><h1>Bestand</h1></div>
        <div className="page-header__actions"><Link to="/search" className="button button--outline"><Icon name="search" size={19} /> Suchen</Link><Link to="/locations" className="button"><Icon name="plus" size={19} /> Lagerort</Link></div>
      </div>
      {pageStatus && <StatusBanner kind={pageStatus.kind} title={pageStatus.title} message={pageStatus.message} />}
      <div className="inventory">
        <Card className="inventory__tree">
          <div className="card__header">
            <h3>Lagerorte</h3>
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
                <span>Unterorte</span>
                <HelpIcon text="Also include items stored in nested child locations under the selected node." />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) => setIncludeDeleted(event.target.checked)}
                />
                <span>Gelöschte</span>
              </label>
            </div>
          </div>
          {selectedLocationId && <div className="muted inventory__location-id">ID: {selectedLocationId}</div>}
          <div className="inventory__summary">{itemCount} {itemCount === 1 ? "Item" : "Items"}</div>
          <div className="inventory__list">
            {itemsQuery.isLoading && <div className="empty">Items werden geladen …</div>}
            {!itemsQuery.isLoading && itemCount === 0 && <div className="empty">Keine Items an diesem Lagerort.</div>}
            {itemsQuery.data?.map((item) => (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="item-row">
                <div><div className="item-row__title">{typeNameMap.get(item.type_id) ?? "Item"}</div><div className="item-row__meta">{item.id}</div></div>
                <div className="item-row__meta">{item.status ?? "stored"}</div>
                <div className="item-row__meta">{item.location_id ? "gelagert" : "in Benutzung"}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InventoryPage;
