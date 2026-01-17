import { Link } from "@tanstack/react-router";
import { Card } from "@/components/Card";
import { StatusBanner } from "@/components/StatusBanner";
import { getRuntimeConfig } from "@/config/runtime";

const EditHubPage = () => {
  const { featureFlags } = getRuntimeConfig();

  if (!featureFlags.inventory && !featureFlags.itemTypes && !featureFlags.snapshots) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Edit tools are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        {featureFlags.inventory && (
          <Card>
            <div className="card__header">
              <h3>Update Item</h3>
            </div>
            <div className="muted">Edit status or description on an item.</div>
            <Link to="/items/update" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.inventory && (
          <Card>
            <div className="card__header">
              <h3>Update Item Props</h3>
            </div>
            <div className="muted">Merge or replace item properties.</div>
            <Link to="/items/props" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.inventory && (
          <Card>
            <div className="card__header">
              <h3>Update Location</h3>
            </div>
            <div className="muted">Rename or re-parent a location.</div>
            <Link to="/locations/update" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.snapshots && (
          <Card>
            <div className="card__header">
              <h3>Item Snapshots</h3>
            </div>
            <div className="muted">List snapshots attached to an item.</div>
            <Link to="/items/snapshots/list" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}

        {featureFlags.itemTypes && (
          <Card>
            <div className="card__header">
              <h3>Item Type Editor</h3>
            </div>
            <div className="muted">Edit schemas and label templates.</div>
            <Link to="/item-types" className="button button--outline button--sm">
              Open
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EditHubPage;