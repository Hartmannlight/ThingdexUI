import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listItemsMissingLocation } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { Icon } from "@/components/Icon";

const TasksPage = () => {
  const query = useQuery({ queryKey: ["items", "missing-location"], queryFn: listItemsMissingLocation });
  return <div className="page"><div className="section-heading"><div><div className="eyebrow">Eingangskorb</div><h1>Aufgaben</h1></div><span className="count-pill">{query.data?.length ?? 0} offen</span></div><div className="segmented"><button className="is-active">Offen</button><button disabled>Erledigt</button><button disabled>Alle</button></div>{query.isLoading && <div className="skeleton-list"><div/><div/><div/></div>}{query.isError && <div className="inline-alert inline-alert--error"><Icon name="warning" /><div><strong>Aufgaben konnten nicht geladen werden</strong><small>{parseErrorMessage(query.error)}</small></div></div>}{query.data?.length === 0 && <div className="empty-state"><span><Icon name="check" size={34} /></span><h2>Alles erledigt</h2><p>Derzeit fehlen keinem Item Lagerortangaben.</p></div>}<div className="task-list">{query.data?.map((item) => <article className="task-card" key={item.id}><span className="task-card__icon task-card__icon--warning"><Icon name="map" /></span><div className="task-card__copy"><strong>{item.type?.name ?? "Item ohne Lagerort"}</strong><small>{item.description || item.id}</small></div><Link to="/items/$itemId" params={{ itemId: item.id }} className="button button--outline">Zuweisen</Link></article>)}</div><div className="info-panel info-panel--muted"><Icon name="clipboard" /><div><strong>Weitere Aufgaben folgen mit Backend-Unterstützung</strong><p>Unbekannte Barcodes, Inventurabweichungen und persistente Druckjobs werden hier später ergänzt.</p></div></div></div>;
};

export default TasksPage;
