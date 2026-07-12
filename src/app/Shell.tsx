import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { getRuntimeConfig } from "@/config/runtime";
import { Toasts } from "@/components/Toasts";
import { Icon, type IconName } from "@/components/Icon";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const titles: Array<[string, string]> = [
  ["/move", "Umlagern"], ["/search", "Suche"], ["/inventory", "Bestand"], ["/scan", "Scannen"],
  ["/tasks", "Aufgaben"], ["/create-items", "Items erfassen"], ["/item-types", "Item Types"],
  ["/locations", "Lagerorte"], ["/relations", "Relationen"], ["/labels", "Etiketten"]
];

const NavIcon = ({ icon, label }: { icon: IconName; label: string }) => <><Icon name={icon} /><span>{label}</span></>;
const activeProps = { className: "side-nav__link is-active" };
const bottomActiveProps = { className: "bottom-nav__link is-active" };

const Shell = () => {
  const { featureFlags } = getRuntimeConfig();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  useBootstrapRootLocation();
  useEffect(() => setMenuOpen(false), [pathname]);
  const workflow = pathname === "/move";
  const pageTitle = titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Hausinventar";

  return <div className={`app-shell${workflow ? " app-shell--workflow" : ""}`}>
    {!workflow && <header className="topbar">
      <button className="icon-button topbar__menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Navigation öffnen"><Icon name="menu" /></button>
      <Link to="/" className="brand"><span className="brand__mark"><Icon name="box" /></span><strong>Thingdex</strong></Link>
      <span className="topbar__context">{pageTitle}</span>
      <div className="topbar__status"><span className="connection-pill"><i /> UI bereit</span><button className="icon-button" aria-label="Audiofeedback"><Icon name="volume" /></button></div>
    </header>}

    {!workflow && <aside className={`sidebar${menuOpen ? " is-open" : ""}`}>
      <div className="sidebar__scroll"><nav className="side-nav" aria-label="Hauptnavigation">
        <div className="side-nav__group"><span className="side-nav__title">Übersicht</span>
          <Link to="/" activeOptions={{ exact: true }} className="side-nav__link" activeProps={activeProps}><NavIcon icon="home" label="Start" /></Link>
          <Link to="/tasks" className="side-nav__link" activeProps={activeProps}><NavIcon icon="clipboard" label="Aufgaben" /></Link>
        </div>
        <div className="side-nav__group"><span className="side-nav__title">Bestand</span>
          {featureFlags.inventory && <Link to="/inventory" className="side-nav__link" activeProps={activeProps}><NavIcon icon="archive" label="Bestand" /></Link>}
          {featureFlags.search && <Link to="/search" className="side-nav__link" activeProps={activeProps}><NavIcon icon="search" label="Suche" /></Link>}
          {featureFlags.inventory && <Link to="/locations" className="side-nav__link" activeProps={activeProps}><NavIcon icon="map" label="Lagerorte" /></Link>}
        </div>
        <div className="side-nav__group"><span className="side-nav__title">Vorgänge</span>
          <Link to="/scan" className="side-nav__link" activeProps={activeProps}><NavIcon icon="scan" label="Scannen" /></Link>
          {featureFlags.createItems && <Link to="/create-items" className="side-nav__link" activeProps={activeProps}><NavIcon icon="plus" label="Items erfassen" /></Link>}
          {featureFlags.moveWorkflow && <Link to="/move" className="side-nav__link" activeProps={activeProps}><NavIcon icon="move" label="Umlagern" /></Link>}
          {featureFlags.labelPrinting && <Link to="/labels/reprint" className="side-nav__link" activeProps={activeProps}><NavIcon icon="printer" label="Etiketten" /></Link>}
        </div>
        <div className="side-nav__group"><span className="side-nav__title">Verwaltung</span>
          {featureFlags.labelPrinting && <Link to="/labels/automation" className="side-nav__link" activeProps={activeProps}><NavIcon icon="printer" label="Label-Automation" /></Link>}
          {featureFlags.itemTypes && <Link to="/item-types" className="side-nav__link" activeProps={activeProps}><NavIcon icon="types" label="Item Types" /></Link>}
          {featureFlags.snapshots && <Link to="/items/snapshots/list" className="side-nav__link" activeProps={activeProps}><NavIcon icon="layers" label="Snapshots" /></Link>}
          {featureFlags.inventory && <Link to="/edit" className="side-nav__link" activeProps={activeProps}><NavIcon icon="cog" label="Werkzeuge" /></Link>}
        </div>
      </nav></div>
      <div className="sidebar__footer"><span className="connection-dot" /><span><strong>UI bereit</strong><small>Dienste werden bei Bedarf geprüft</small></span></div>
    </aside>}
    {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Navigation schließen" />}

    <main className="app-main"><Outlet /></main>

    {!workflow && <nav className="bottom-nav" aria-label="Mobile Navigation">
      <Link to="/" activeOptions={{ exact: true }} className="bottom-nav__link" activeProps={bottomActiveProps}><NavIcon icon="home" label="Start" /></Link>
      <Link to="/inventory" className="bottom-nav__link" activeProps={bottomActiveProps}><NavIcon icon="archive" label="Bestand" /></Link>
      <Link to="/scan" className="bottom-nav__link" activeProps={bottomActiveProps}><NavIcon icon="scan" label="Scannen" /></Link>
      <Link to="/tasks" className="bottom-nav__link" activeProps={bottomActiveProps}><NavIcon icon="clipboard" label="Aufgaben" /></Link>
    </nav>}
    <Toasts />
  </div>;
};

export default Shell;
