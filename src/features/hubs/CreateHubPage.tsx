import { Link } from "@tanstack/react-router";
import { Card } from "@/components/Card";
import { StatusBanner } from "@/components/StatusBanner";
import { getRuntimeConfig } from "@/config/runtime";

const CreateHubPage = () => {
  const { featureFlags } = getRuntimeConfig();

  if (!featureFlags.createItems && !featureFlags.inventory && !featureFlags.itemTypes && !featureFlags.snapshots) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Create tools are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        {featureFlags.createItems && (
          <Card>
            <div className="card__header">
              <h3>Create Items</h3>
            </div>
            <div className="muted">Scanner-first flow for rapid item entry.</div>
            <Link to="/create-items" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.inventory && (
          <Card>
            <div className="card__header">
              <h3>Create Location</h3>
            </div>
            <div className="muted">Add rooms, shelves, or containers.</div>
            <Link to="/locations" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.itemTypes && (
          <Card>
            <div className="card__header">
              <h3>Create Item Type</h3>
            </div>
            <div className="muted">Define a schema for item properties.</div>
            <Link to="/item-types/create" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.snapshots && (
          <Card>
            <div className="card__header">
              <h3>Create Snapshot</h3>
            </div>
            <div className="muted">Attach notes or structured data to an item.</div>
            <Link to="/items/snapshots" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateHubPage;
