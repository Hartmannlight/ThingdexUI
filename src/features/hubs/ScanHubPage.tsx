import { Link } from "@tanstack/react-router";
import { Icon, type IconName } from "@/components/Icon";

const flows: Array<{ to: string; icon: IconName; title: string; description: string; badge?: string }> = [
  { to: "/move", icon: "move", title: "Items umlagern", description: "Ziel sperren und mehrere Items nacheinander scannen", badge: "Pi-optimiert" },
  { to: "/create-items", icon: "plus", title: "Items erfassen", description: "Dynamisches Formular nach Item Type" },
  { to: "/locations/move", icon: "map", title: "Lagerort verschieben", description: "Quellort und neuen Parent scannen" },
  { to: "/relations/attach", icon: "link", title: "Relation anbringen", description: "Parent und Child miteinander verbinden" },
  { to: "/relations/detach", icon: "link", title: "Relation lösen", description: "Item lösen und Zielort festlegen" },
  { to: "/labels/reprint", icon: "printer", title: "Etikett senden", description: "Item oder Lagerort scannen und erneut drucken" }
];

const ScanHubPage = () => <div className="page"><div className="section-heading"><div><div className="eyebrow">Scanner-Workflows</div><h1>Was möchtest du tun?</h1></div><div className="ready-pill"><span /> Scan-Eingabe bereit</div></div><div className="flow-grid">{flows.map((flow) => <Link key={flow.to} to={flow.to} className="flow-card"><span className="flow-card__icon"><Icon name={flow.icon} size={30} /></span><span className="flow-card__copy"><strong>{flow.title}</strong><small>{flow.description}</small></span>{flow.badge && <span className="badge badge--success">{flow.badge}</span>}<Icon name="chevron-right" className="flow-card__chevron" /></Link>)}</div><div className="info-panel"><Icon name="scan" /><div><strong>Sicherer Standard</strong><p>Ein Scan auf normalen Seiten öffnet nur den Datensatz. Daten ändern sich erst in einem bewusst gestarteten Workflow.</p></div></div></div>;

export default ScanHubPage;
