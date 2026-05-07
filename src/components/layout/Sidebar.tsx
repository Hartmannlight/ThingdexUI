import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getRuntimeConfig } from "@/config/runtime";

const NavItem = ({ to, label, mark }: { to: string; label: string; mark: string }) => (
  <Link to={to} className="side-nav__item" activeProps={{ className: "side-nav__item is-active" }}>
    <span className="side-nav__mark">{mark}</span>
    <span>{label}</span>
  </Link>
);

const Divider = () => <div className="side-nav__divider" />;

export const Sidebar = ({ footer }: { footer?: ReactNode }) => {
  const { defaults } = getRuntimeConfig();
  const printer = defaults.defaultPrinterId || "Zebra-01";

  return (
    <aside className="sidebar">
      <Link to="/scan" className="brand">
        <span className="brand__cube" />
        <span>thingdex</span>
      </Link>

      <nav className="side-nav" aria-label="Hauptnavigation">
        <NavItem to="/scan" mark="[]" label="Scannen" />
        <NavItem to="/locations" mark="<> " label="Orte" />
        <NavItem to="/items" mark="##" label="Inventar" />
        <NavItem to="/intake" mark="++" label="Eingang" />
        <Divider />
        <NavItem to="/maintenance" mark="!!" label="Wartung" />
        <NavItem to="/admin" mark="{}" label="Verwaltung" />
        <NavItem to="/system" mark="i" label="System" />
      </nav>

      <div className="station-card">
        <div className="station-card__label">Station</div>
        <div className="station-card__name">Werkstatt</div>
        <div className="station-card__printer">
          <span className="station-card__printer-icon">PR</span>
          <span>Drucker: {printer}</span>
        </div>
      </div>
      {footer}
    </aside>
  );
};
