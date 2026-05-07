import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { createLocation, getLocation, getLocationTree, getPath, listChildren, listItemsInLocation, updateLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import type { LocationTreeNode } from "@/api/types";
import { ActionTile } from "@/components/actions/ActionTile";
import { useToasts } from "@/hooks/useToasts";
import { itemTitle, locationPath, shortId } from "@/utils/entityLabels";

const TreeNode = ({ node, level = 0 }: { node: LocationTreeNode; level?: number }) => (
  <div className="tree-node" style={{ paddingLeft: level * 14 }}>
    <Link to="/locations/$locationId" params={{ locationId: node.id }} className="tree-node__link">
      <span className="tree-node__mark">&lt;&gt;</span>
      {node.name}
    </Link>
    {node.children?.map((child) => <TreeNode key={child.id} node={child} level={level + 1} />)}
  </div>
);

export const LocationDetailPage = () => {
  const params = useParams({ from: "/locations/$locationId" });
  return <LocationsPage selectedLocationId={params.locationId} />;
};

const LocationsPage = ({ selectedLocationId }: { selectedLocationId?: string }) => {
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("box");
  const [moveTargetId, setMoveTargetId] = useState("");
  const treeQuery = useQuery({ queryKey: ["locations", "tree"], queryFn: () => getLocationTree() });
  const rootId = treeQuery.data?.id;
  const locationId = selectedLocationId || rootId;

  const detailQuery = useQuery({
    queryKey: ["locations", locationId],
    queryFn: async () => {
      if (!locationId) throw new Error("Kein Ort ausgewählt.");
      const [location, path, children, items, descendantItems] = await Promise.all([
        getLocation(locationId),
        getPath(locationId),
        listChildren(locationId, { limit: 100 }),
        listItemsInLocation(locationId, false, { limit: 100 }),
        listItemsInLocation(locationId, true, { limit: 200 })
      ]);
      return { location, path, children, items, descendantItems };
    },
    enabled: !!locationId
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!locationId) throw new Error("Erst einen Parent-Ort auswählen.");
      return createLocation({ name: newName, kind: newKind, parent_id: locationId });
    },
    onSuccess: async () => {
      setNewName("");
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      toasts.success("Unterort angelegt");
    },
    onError: (error) => toasts.error("Ort konnte nicht angelegt werden", parseErrorMessage(error))
  });

  const moveMutation = useMutation({
    mutationFn: () => {
      if (!locationId || !moveTargetId) throw new Error("Ort und Zielort werden benötigt.");
      return updateLocation(locationId, { parent_id: moveTargetId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      toasts.success("Ort verschoben");
    },
    onError: (error) => toasts.error("Ort konnte nicht verschoben werden", parseErrorMessage(error))
  });

  const detail = detailQuery.data;

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Orte</p>
          <h1>Ortsbaum und Inhalt</h1>
        </div>
        <Link className="button button--outline" to="/scan">
          Zur Scanner-Ansicht
        </Link>
      </div>

      <div className="split-view">
        <section className="panel panel--compact">
          <h2>Baum</h2>
          {treeQuery.data ? <TreeNode node={treeQuery.data} /> : <div className="empty">Ortsbaum wird geladen ...</div>}
        </section>

        <section className="panel">
          {detail ? (
            <>
              <div className="section-title">
                <span className="section-title__mark">&lt;&gt;</span>
                Ort-Detail
              </div>
              <h1>{detail.location.name}</h1>
              <dl className="meta-list meta-list--wide">
                <div>
                  <dt>Pfad</dt>
                  <dd>{locationPath(detail.path)}</dd>
                </div>
                <div>
                  <dt>Direkte Items</dt>
                  <dd>{detail.items.length}</dd>
                </div>
                <div>
                  <dt>Items inkl. Unterorte</dt>
                  <dd>{detail.descendantItems.length}</dd>
                </div>
                <div>
                  <dt>Unterorte</dt>
                  <dd>{detail.children.length}</dd>
                </div>
              </dl>

              <div className="action-grid action-grid--three">
                <ActionTile mark="BX" title="Inhalt anzeigen" detail={`${detail.items.length} direkte Items`} />
                <ActionTile mark="[]" title="Items hierhin scannen" detail="In /scan Bulk-Modus starten" />
                <ActionTile mark="PR" title="Label drucken" detail="Kontextaktion" />
                <ActionTile mark="++" title="Unterort anlegen" detail="Name unten eingeben" />
                <ActionTile mark="-&gt;" title="Ort verschieben" detail="Parent ändern" />
                <ActionTile mark="ED" title="Bearbeiten" detail={shortId(detail.location.id)} />
              </div>

              <div className="tabs-grid">
                <section>
                  <h2>Inhalt</h2>
                  <div className="touch-list">
                    {detail.items.map((item) => (
                      <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="touch-card">
                        <strong>{itemTitle(item)}</strong>
                        <span>{item.status || "unknown"}</span>
                      </Link>
                    ))}
                    {detail.items.length === 0 && <div className="empty">Keine direkten Items.</div>}
                  </div>
                </section>
                <section>
                  <h2>Unterorte</h2>
                  <div className="touch-list">
                    {detail.children.map((child) => (
                      <Link key={child.id} to="/locations/$locationId" params={{ locationId: child.id }} className="touch-card">
                        <strong>{child.name}</strong>
                        <span>{child.kind || "Ort"}</span>
                      </Link>
                    ))}
                    {detail.children.length === 0 && <div className="empty">Keine Unterorte.</div>}
                  </div>
                </section>
              </div>

              <section className="form-panel">
                <h2>Unterort anlegen</h2>
                <div className="form-grid">
                  <input className="input" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Name" />
                  <input className="input" value={newKind} onChange={(event) => setNewKind(event.target.value)} placeholder="Art" />
                  <button className="button button--primary" type="button" onClick={() => createMutation.mutate()} disabled={!newName}>
                    Anlegen
                  </button>
                </div>
              </section>

              <section className="form-panel">
                <h2>Ort verschieben</h2>
                <div className="form-grid">
                  <input
                    className="input"
                    value={moveTargetId}
                    onChange={(event) => setMoveTargetId(event.target.value)}
                    placeholder="Zielort-ID scannen oder einfügen"
                  />
                  <button className="button button--outline" type="button" onClick={() => moveMutation.mutate()} disabled={!moveTargetId}>
                    Parent ändern
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div className="empty">Ort auswählen.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LocationsPage;
