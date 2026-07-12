import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getItem, moveItem } from "@/api/items";
import { getLocation, getPath } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import type { LocationPathItem } from "@/api/types";
import { Icon } from "@/components/Icon";

type Result = {
  id: string;
  itemId: string;
  title: string;
  sourceId: string | null;
  sourceLabel: string;
  targetLabel: string;
  status: "success" | "error" | "undone";
  message?: string;
};

const pathLabel = (path: LocationPathItem[]) => path.map((node) => node.name).join(" › ");

const MoveItemPage = () => {
  const navigate = useNavigate();
  const targetRef = useRef<HTMLInputElement | null>(null);
  const itemRef = useRef<HTMLInputElement | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetPath, setTargetPath] = useState<LocationPathItem[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [targetBusy, setTargetBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => { targetRef.current?.focus(); }, []);
  const successes = results.filter((result) => result.status === "success").length;
  const failures = results.filter((result) => result.status === "error").length;

  const resolveTarget = async () => {
    const id = targetInput.trim();
    if (!id || targetBusy) return;
    setTargetBusy(true); setError(null);
    try {
      await getLocation(id);
      const path = await getPath(id);
      setTargetId(id); setTargetPath(path); setTargetInput("");
      window.setTimeout(() => itemRef.current?.focus(), 0);
    } catch (err) { setError(`Ziel nicht gefunden: ${parseErrorMessage(err)}`); targetRef.current?.select(); }
    finally { setTargetBusy(false); }
  };

  const scanItem = async () => {
    const id = itemInput.trim();
    if (!id || busy || !targetId) return;
    setBusy(true); setError(null); setItemInput("");
    const resultId = crypto.randomUUID();
    try {
      const item = await getItem(id);
      const sourceId = item.location?.physical_location_id ?? null;
      const sourceLabel = item.location?.effective_location_path?.length ? pathLabel(item.location.effective_location_path) : "Ohne physischen Ort";
      if (sourceId === targetId) throw new Error("Dieses Item liegt bereits am gewählten Ziel.");
      await moveItem(id, { location_id: targetId });
      const result: Result = { id: resultId, itemId: id, title: item.description || item.type?.name || "Item", sourceId, sourceLabel, targetLabel: pathLabel(targetPath), status: "success" };
      setResults((current) => [result, ...current].slice(0, 30));
    } catch (err) {
      const message = err instanceof Error ? err.message : parseErrorMessage(err);
      const result: Result = { id: resultId, itemId: id, title: id, sourceId: null, sourceLabel: "–", targetLabel: pathLabel(targetPath), status: "error", message };
      setResults((current) => [result, ...current].slice(0, 30));
      setError(message);
    } finally { setBusy(false); window.setTimeout(() => itemRef.current?.focus(), 0); }
  };

  const undoLast = async () => {
    const latest = results.find((result) => result.status === "success");
    if (!latest?.sourceId || busy) return;
    setBusy(true); setError(null);
    try {
      const current = await getItem(latest.itemId);
      if (current.location?.physical_location_id !== targetId) throw new Error("Undo abgebrochen: Das Item wurde inzwischen erneut verändert.");
      await moveItem(latest.itemId, { location_id: latest.sourceId });
      setResults((items) => items.map((item) => item.id === latest.id ? { ...item, status: "undone", message: "Rückgängig gemacht" } : item));
    } catch (err) { setError(parseErrorMessage(err)); }
    finally { setBusy(false); window.setTimeout(() => itemRef.current?.focus(), 0); }
  };

  const onEnter = (callback: () => void) => (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") { event.preventDefault(); callback(); } };
  const changeTarget = () => { setTargetId(""); setTargetPath([]); setError(null); window.setTimeout(() => targetRef.current?.focus(), 0); };

  return <div className="scan-workflow">
    <header className="scan-workflow__header"><button className="icon-button" onClick={() => navigate({ to: "/scan" })} aria-label="Zurück"><Icon name="arrow-left" /></button><h1>Umlagern</h1><span className="mode-pill">AKTIV</span><span className="scan-workflow__online"><i/> Online</span></header>
    <main className="scan-workflow__main">
      {!targetId ? <section className="scan-setup"><span className="scan-setup__icon"><Icon name="map" size={40}/></span><div><div className="eyebrow">Schritt 1 von 2</div><h2>Zielort festlegen</h2><p>Scanne den Lagerort, in den du mehrere Items verschieben möchtest.</p></div><div className="scan-input-box"><Icon name="scan"/><input ref={targetRef} value={targetInput} onChange={(event) => setTargetInput(event.target.value)} onKeyDown={onEnter(resolveTarget)} placeholder="Lagerort scannen …"/><button onClick={resolveTarget} disabled={targetBusy}>{targetBusy ? "Prüfe …" : "Übernehmen"}</button></div>{error && <div className="scan-error"><Icon name="warning"/>{error}</div>}</section> : <>
        <section className="target-strip"><Icon name="map"/><div><small>AKTIVES ZIEL</small><strong>{pathLabel(targetPath)}</strong></div><button onClick={changeTarget} disabled={busy}>Ziel ändern</button></section>
        <section className={`scan-ready${error ? " scan-ready--error" : ""}`}><span><Icon name={busy ? "history" : error ? "warning" : "scan"} size={34}/></span><div><strong>{busy ? "WIRD VERARBEITET" : error ? "LETZTER SCAN ABGELEHNT" : "NÄCHSTES ITEM SCANNEN"}</strong><small>{error || "Enter bestätigt automatisch – das Ziel bleibt gesperrt"}</small></div><input ref={itemRef} value={itemInput} onChange={(event) => setItemInput(event.target.value)} onKeyDown={onEnter(scanItem)} disabled={busy} aria-label="Item scannen"/></section>
        <section className="session-summary"><span><b>{successes}</b> verschoben</span><span><b className={failures ? "text-error" : ""}>{failures}</b> Fehler</span><span>{results.length ? "Letzter Scan gerade eben" : "Bereit"}</span></section>
        <section className="scan-results">{results.length === 0 ? <div className="scan-results__empty"><Icon name="scan"/><span>Scanne jetzt das erste Item.</span></div> : results.map((result) => <article key={result.id} className={`scan-result scan-result--${result.status}`}><span className="scan-result__icon"><Icon name={result.status === "success" ? "check" : result.status === "undone" ? "history" : "x"}/></span><div><strong>{result.title}</strong><small>{result.status === "error" ? result.message : result.status === "undone" ? result.message : `${result.sourceLabel} → ${result.targetLabel}`}</small></div><code>{result.itemId}</code></article>)}</section>
      </>}
    </main>
    {targetId && <footer className="scan-workflow__footer"><button className="workflow-button workflow-button--secondary" onClick={undoLast} disabled={busy || !results.some((item) => item.status === "success" && item.sourceId)}><Icon name="history"/> Letzten rückgängig</button><button className="workflow-button workflow-button--primary" onClick={() => navigate({ to: "/" })}><span>Fertig · {successes}</span><Icon name="check"/></button></footer>}
  </div>;
};

export default MoveItemPage;
