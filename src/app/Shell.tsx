import { Link, Outlet } from "@tanstack/react-router";
import { getRuntimeConfig } from "@/config/runtime";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { Toasts } from "@/components/Toasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";
import { HelpIcon } from "@/components/HelpIcon";

const Shell = () => {
  const { featureFlags } = getRuntimeConfig();
  const { enabled, setEnabled } = useAudioFeedback();
  useBootstrapRootLocation();

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? "nav__link is-active" : "nav__link");

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <div className="app__logo">Thingdex</div>
          <div className="app__tagline">Scanner-first inventory ops</div>
        </div>
        {featureFlags.audioFeedback && (
          <div className="app__controls">
            <label className="toggle">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span>Audio</span>
              <HelpIcon text="Toggle scan beeps and confirmation sounds for faster feedback." />
            </label>
          </div>
        )}
      </header>

      <aside className="app__sidebar">
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
          {featureFlags.inventory && (
            <Link to="/locations/move" className={navClass}>
              Move Location
            </Link>
          )}
          {featureFlags.inventory && (
            <Link to="/relations/attach" className={navClass}>
              Attach Item
            </Link>
          )}
          {featureFlags.inventory && (
            <Link to="/relations/detach" className={navClass}>
              Detach Relation
            </Link>
          )}
          {featureFlags.inventory && (
            <Link to="/relations/update" className={navClass}>
              Update Relation
            </Link>
          )}
          {featureFlags.inventory && (
            <Link to="/locations/update" className={navClass}>
              Update Location
            </Link>
          )}
          {featureFlags.labelPrinting && (
            <Link to="/labels/reprint" className={navClass}>
              Reprint Label
            </Link>
          )}
        </div>

        <div className="nav-group">
          <div className="nav-group__title">Containers</div>
          {featureFlags.inventory && (
            <Link to="/" className={navClass}>
              Overview
            </Link>
          )}
          <Link to="/locations" className={navClass}>
            Locations
          </Link>
        </div>

        <div className="nav-group">
          <div className="nav-group__title">Items</div>
          {featureFlags.search && (
            <Link to="/search" className={navClass}>
              Search + UUID Lookup
            </Link>
          )}
          {featureFlags.inventory && (
            <Link to="/items/missing-location" className={navClass}>
              Missing Location
            </Link>
          )}
        </div>

        <div className="nav-group">
          <div className="nav-group__title">Create</div>
          <Link to="/create" className={navClass}>
            Create Tools
          </Link>
        </div>

        <div className="nav-group">
          <div className="nav-group__title">Edit</div>
          <Link to="/edit" className={navClass}>
            Edit Tools
          </Link>
        </div>
      </aside>

      <main className="app__main">
        <Outlet />
      </main>

      <Toasts />
    </div>
  );
};

export default Shell;
