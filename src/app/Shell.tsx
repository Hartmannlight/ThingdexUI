import { Link, Outlet } from "@tanstack/react-router";
import { getRuntimeConfig } from "@/config/runtime";
import { Toasts } from "@/components/Toasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const Shell = () => {
  const { featureFlags } = getRuntimeConfig();
  useBootstrapRootLocation();

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? "nav__link is-active" : "nav__link");

  return (
    <div className="app">
      <aside className="app__sidebar">
        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Overview</div>
            <Link to="/" className={navClass}>
              Inventory Overview
            </Link>
          </div>
        )}

        <div className="nav-group">
          <div className="nav-group__title">Daily Ops</div>
          {featureFlags.createItems && (
            <Link to="/create-items" className={navClass}>
              Create Items
            </Link>
          )}
          {featureFlags.moveWorkflow && (
            <Link to="/move" className={navClass}>
              Move Item
            </Link>
          )}
          {featureFlags.search && (
            <Link to="/search" className={navClass}>
              Search Items
            </Link>
          )}
        </div>

        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Locations</div>
            <Link to="/locations" className={navClass}>
              Create + Browse
            </Link>
            <Link to="/locations/move" className={navClass}>
              Move Location
            </Link>
          </div>
        )}

        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Relations</div>
            <Link to="/relations/attach" className={navClass}>
              Attach Item
            </Link>
            <Link to="/relations/detach" className={navClass}>
              Detach Relation
            </Link>
            <Link to="/relations/update" className={navClass}>
              Update Relation
            </Link>
          </div>
        )}

        {featureFlags.labelPrinting && (
          <div className="nav-group">
            <div className="nav-group__title">Labels</div>
            <Link to="/labels/reprint" className={navClass}>
              Reprint Label
            </Link>
          </div>
        )}

        {(featureFlags.itemTypes || featureFlags.inventory || featureFlags.snapshots) && (
          <div className="nav-group">
            <div className="nav-group__title">Tools</div>
            {featureFlags.inventory && (
              <Link to="/items/update" className={navClass}>
                Update Item
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/items/props" className={navClass}>
                Update Item Props
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/items/history" className={navClass}>
                Item History
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/items/missing-location" className={navClass}>
                Missing Locations
              </Link>
            )}
            {featureFlags.snapshots && (
              <Link to="/items/snapshots/list" className={navClass}>
                Item Snapshots
              </Link>
            )}
            {featureFlags.snapshots && (
              <Link to="/items/snapshots" className={navClass}>
                Create Snapshot
              </Link>
            )}
            {featureFlags.itemTypes && (
              <Link to="/item-types/create" className={navClass}>
                Create Item Type
              </Link>
            )}
            {featureFlags.itemTypes && (
              <Link to="/item-types" className={navClass}>
                Item Type Editor
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/items/delete" className={navClass}>
                Delete Item
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/locations/delete" className={navClass}>
                Delete Location
              </Link>
            )}
            {featureFlags.inventory && (
              <Link to="/relations/delete" className={navClass}>
                Delete Relation
              </Link>
            )}
            {featureFlags.itemTypes && (
              <Link to="/item-types/delete" className={navClass}>
                Delete Item Type
              </Link>
            )}
          </div>
        )}
      </aside>

      <main className="app__main">
        <Outlet />
      </main>

      <Toasts />
    </div>
  );
};

export default Shell;
