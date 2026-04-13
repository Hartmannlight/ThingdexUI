import type { ReactNode } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { getRuntimeConfig } from "@/config/runtime";
import { Toasts } from "@/components/Toasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const NavItem = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="nav__link" activeProps={{ className: "nav__link is-active" }}>
    {children}
  </Link>
);

const Shell = () => {
  const { featureFlags } = getRuntimeConfig();
  useBootstrapRootLocation();

  return (
    <div className="app">
      <aside className="app__sidebar">
        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Overview</div>
            <NavItem to="/">Inventory Overview</NavItem>
          </div>
        )}

        <div className="nav-group">
          <div className="nav-group__title">Daily Ops</div>
          {featureFlags.createItems && <NavItem to="/create-items">Create Items</NavItem>}
          {featureFlags.moveWorkflow && <NavItem to="/move">Move Item</NavItem>}
          {featureFlags.search && <NavItem to="/search">Search Items</NavItem>}
        </div>

        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Locations</div>
            <NavItem to="/locations">Create + Browse</NavItem>
            <NavItem to="/locations/move">Move Location</NavItem>
          </div>
        )}

        {featureFlags.inventory && (
          <div className="nav-group">
            <div className="nav-group__title">Relations</div>
            <NavItem to="/relations/attach">Attach Item</NavItem>
            <NavItem to="/relations/detach">Detach Relation</NavItem>
            <NavItem to="/relations/update">Update Relation</NavItem>
          </div>
        )}

        {featureFlags.labelPrinting && (
          <div className="nav-group">
            <div className="nav-group__title">Labels</div>
            <NavItem to="/labels/reprint">Reprint Label</NavItem>
          </div>
        )}

        {(featureFlags.itemTypes || featureFlags.inventory || featureFlags.snapshots) && (
          <div className="nav-group">
            <div className="nav-group__title">Tools</div>
            {featureFlags.inventory && <NavItem to="/items/update">Update Item</NavItem>}
            {featureFlags.inventory && <NavItem to="/items/props">Update Item Props</NavItem>}
            {featureFlags.inventory && <NavItem to="/items/history">Item History</NavItem>}
            {featureFlags.inventory && <NavItem to="/items/missing-location">Missing Locations</NavItem>}
            {featureFlags.snapshots && <NavItem to="/items/snapshots/list">Item Snapshots</NavItem>}
            {featureFlags.snapshots && <NavItem to="/items/snapshots">Create Snapshot</NavItem>}
            {featureFlags.itemTypes && <NavItem to="/item-types/create">Create Item Type</NavItem>}
            {featureFlags.itemTypes && <NavItem to="/item-types">Item Type Editor</NavItem>}
            {featureFlags.inventory && <NavItem to="/items/delete">Delete Item</NavItem>}
            {featureFlags.inventory && <NavItem to="/locations/delete">Delete Location</NavItem>}
            {featureFlags.inventory && <NavItem to="/relations/delete">Delete Relation</NavItem>}
            {featureFlags.itemTypes && <NavItem to="/item-types/delete">Delete Item Type</NavItem>}
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
