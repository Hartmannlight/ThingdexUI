import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getItem, getItemHistory, moveItem, updateItem } from "@/api/items";
import { listChildRelations, listParentRelations } from "@/api/relations";
import { printLabel } from "@/api/labelPrint";
import { parseErrorMessage } from "@/api/errors";
import { ActionTile } from "@/components/actions/ActionTile";
import { ItemStatusBadge } from "@/components/entities/ItemStatusBadge";
import { LocationPathBreadcrumb } from "@/components/entities/LocationPathBreadcrumb";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { itemTitle, itemTypeName, jsonPreview, shortId } from "@/utils/entityLabels";

const ItemDetailPage = () => {
  const params = useParams({ from: "/items/$itemId" });
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { defaults } = getRuntimeConfig();
  const [targetLocationId, setTargetLocationId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const itemQuery = useQuery({ queryKey: ["items", params.itemId], queryFn: () => getItem(params.itemId) });
  const childRelations = useQuery({ queryKey: ["items", params.itemId, "relations", "children"], queryFn: () => listChildRelations(params.itemId) });
  const parentRelations = useQuery({ queryKey: ["items", params.itemId, "relations", "parents"], queryFn: () => listParentRelations(params.itemId) });
  const history = useQuery({ queryKey: ["items", params.itemId, "history"], queryFn: () => getItemHistory(params.itemId, { limit: 20 }) });

  const moveMutation = useMutation({
    mutationFn: () => moveItem(params.itemId, { location_id: targetLocationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["items", params.itemId] });
      toasts.success("Item verschoben");
    },
    onError: (error) => toasts.error("Item konnte nicht verschoben werden", parseErrorMessage(error))
  });

  const updateMutation = useMutation({
    mutationFn: () => updateItem(params.itemId, { description: description || null, status: status || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["items", params.itemId] });
      toasts.success("Item aktualisiert");
    },
    onError: (error) => toasts.error("Item konnte nicht aktualisiert werden", parseErrorMessage(error))
  });

  const item = itemQuery.data;

  if (itemQuery.isLoading) return <div className="inline-loading">Item wird geladen ...</div>;
  if (!item) return <div className="error-panel">Item konnte nicht geladen werden.</div>;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="detail-header">
          <div>
            <p className="eyebrow">Item Detail</p>
            <h1>{itemTitle(item)}</h1>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>
        <dl className="meta-list meta-list--wide">
          <div>
            <dt>Typ</dt>
            <dd>{itemTypeName(item)}</dd>
          </div>
          <div>
            <dt>Ort</dt>
            <dd>
              <LocationPathBreadcrumb path={item.location?.effective_location_path} />
            </dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{shortId(item.id)}</dd>
          </div>
        </dl>
        <div className="action-grid">
          <ActionTile mark="-&gt;" title="Verschieben" detail="Zielort unten setzen" />
          <ActionTile
            mark="PR"
            title="Label drucken"
            detail={defaults.defaultPrinterId || "Zebra-01"}
            onClick={() =>
              void printLabel({
                printer_id: defaults.defaultPrinterId || "Zebra-01",
                item_id: item.id,
                return_preview: false
              }).then(
                () => toasts.success("Label gesendet"),
                (error) => toasts.error("Label konnte nicht gedruckt werden", parseErrorMessage(error))
              )
            }
          />
          <ActionTile mark="ED" title="Bearbeiten" detail="Beschreibung / Status" />
          <ActionTile mark="RL" title="Beziehungen" detail={`${childRelations.data?.length || 0} ausgehend`} />
          <ActionTile mark="T" title="Verlauf" detail={`${history.data?.length || 0} Einträge`} />
          <ActionTile mark="!!" title="Gefahrenzone" detail="Löschen später separat" tone="warning" />
        </div>
      </section>

      <div className="tabs-grid">
        <section className="panel">
          <h2>Eigenschaften</h2>
          <div className="props-table">
            {Object.entries(item.props || {}).map(([key, value]) => (
              <div key={key}>
                <strong>{key}</strong>
                <span>{jsonPreview(value)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Verschieben</h2>
          <div className="form-grid">
            <input className="input" value={targetLocationId} onChange={(event) => setTargetLocationId(event.target.value)} placeholder="Zielort-ID" />
            <button className="button button--primary" type="button" onClick={() => moveMutation.mutate()} disabled={!targetLocationId}>
              Verschieben
            </button>
          </div>
          <h2>Bearbeiten</h2>
          <div className="form-grid">
            <input
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={item.description || "Beschreibung"}
            />
            <input className="input" value={status} onChange={(event) => setStatus(event.target.value)} placeholder={item.status || "Status"} />
            <button className="button button--outline" type="button" onClick={() => updateMutation.mutate()}>
              Speichern
            </button>
          </div>
        </section>
      </div>

      <div className="tabs-grid">
        <section className="panel">
          <h2>Beziehungen</h2>
          <div className="touch-list">
            {[...(childRelations.data || []), ...(parentRelations.data || [])].map((relation) => (
              <div className="touch-card" key={relation.id}>
                <strong>{relation.relation_type}</strong>
                <span>{relation.id}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Verlauf</h2>
          <div className="touch-list">
            {history.data?.map((entry) => (
              <div className="touch-card" key={entry.id}>
                <strong>{entry.prop_key}</strong>
                <span>{jsonPreview(entry.value)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItemDetailPage;
