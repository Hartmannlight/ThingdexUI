import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError, parseErrorMessage } from "@/api/errors";
import { getItem, listItemsMissingLocation } from "@/api/items";
import { getLocation } from "@/api/locations";
import { Icon, type IconName } from "@/components/Icon";
import { useQuery } from "@tanstack/react-query";

const actions: Array<{ to: string; icon: IconName; title: string; subtitle: string; tone: string }> = [
  { to: "/search", icon: "search", title: "Finden", subtitle: "Ort und Eigenschaften durchsuchen", tone: "blue" },
  { to: "/create-items", icon: "box", title: "Erfassen", subtitle: "Neues Item oder Serienerfassung", tone: "green" },
  { to: "/move", icon: "move", title: "Umlagern", subtitle: "Ziel festlegen und Items scannen", tone: "violet" },
  { to: "/relations/attach", icon: "link", title: "Verbinden", subtitle: "Item einbauen oder zuordnen", tone: "amber" }
];

const HomePage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ loading: boolean; message?: string }>({ loading: false });
  const tasks = useQuery({ queryKey: ["items", "missing-location", "count"], queryFn: listItemsMissingLocation, staleTime: 30_000 });

  const resolveCode = async () => {
    const id = code.trim();
    if (!id || state.loading) return;
    setState({ loading: true });
    try {
      await getItem(id);
      await navigate({ to: "/items/$itemId", params: { itemId: id } });
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        setState({ loading: false, message: parseErrorMessage(error) });
        return;
      }
    }
    try {
      await getLocation(id);
      await navigate({ to: "/inventory" });
    } catch (error) {
      setState({ loading: false, message: error instanceof ApiError && error.status === 404 ? "Kein Item oder Lagerort gefunden." : parseErrorMessage(error) });
      inputRef.current?.select();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); void resolveCode(); }
  };

  return (
    <div className="page page--home">
      <section className="hero-search" aria-label="Code auflösen">
        <Icon name="search" size={30} />
        <input ref={inputRef} autoFocus value={code} onChange={(event) => { setCode(event.target.value); setState({ loading: false }); }} onKeyDown={onKeyDown} placeholder="Item oder Lagerort scannen …" aria-label="Item oder Lagerort scannen" />
        <button className="scan-enter" onClick={resolveCode} disabled={state.loading}>{state.loading ? "PRÜFE …" : "SCAN + ENTER"}</button>
      </section>
      {state.message && <div className="inline-alert inline-alert--error"><Icon name="warning" />{state.message}</div>}
      <section className="action-grid" aria-label="Häufige Aktionen">
        {actions.map((action) => <Link key={action.to} to={action.to} className="action-tile"><span className={`action-tile__icon action-tile__icon--${action.tone}`}><Icon name={action.icon} size={31} /></span><span className="action-tile__copy"><strong>{action.title}</strong><small>{action.subtitle}</small></span><Icon name="chevron-right" className="action-tile__chevron" /></Link>)}
      </section>
      <Link to="/tasks" className="attention-banner"><span className="attention-banner__icon"><Icon name="warning" /></span><span><strong>{tasks.data?.length ? `${tasks.data.length} offene ${tasks.data.length === 1 ? "Aufgabe" : "Aufgaben"}` : "Aufgaben und offene Fälle"}</strong><small>Fehlende Lagerorte und fehlgeschlagene Vorgänge prüfen</small></span><Icon name="chevron-right" /></Link>
    </div>
  );
};

export default HomePage;
