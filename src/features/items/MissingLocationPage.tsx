import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StatusBanner } from "@/components/StatusBanner";
import { listItemsMissingLocation } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";

const MissingLocationPage = () => {
  const { featureFlags } = getRuntimeConfig();

  const missingQuery = useQuery({
    queryKey: ["items", "missing-location"],
    queryFn: () => listItemsMissingLocation(),
    enabled: featureFlags.inventory
  });

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Inventory tools are disabled." />
      </div>
    );
  }

  const items = missingQuery.data ?? [];

  return (
    <div className="page">
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header">
            <h2>Missing Locations</h2>
            <Button size="sm" onClick={() => missingQuery.refetch()} disabled={missingQuery.isFetching}>
              {missingQuery.isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="muted">Items that have no effective location assigned.</div>
          {missingQuery.isError && (
            <StatusBanner kind="error" title="Load failed" message={parseErrorMessage(missingQuery.error)} />
          )}
          <div className="inventory__summary">{items.length} items</div>
          {missingQuery.isLoading && <div className="empty">Loading items...</div>}
        </Card>

        <Card>
          <div className="card__header">
            <h3>Results</h3>
          </div>
          {items.length === 0 && !missingQuery.isLoading && <div className="empty">No items missing a location.</div>}
          <div className="list">
            {items.map((item) => (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="list__row">
                <div>
                  <div className="list__title">{item.type?.name ?? "Item"}</div>
                  <div className="muted">{item.id}</div>
                </div>
                <div className="muted">{item.status ?? "stored"}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MissingLocationPage;
