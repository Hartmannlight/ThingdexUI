import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/Card";
import { StatusBanner } from "@/components/StatusBanner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { deleteItem, getItem } from "@/api/items";
import {
  createRelation,
  deleteRelation,
  detachRelation,
  listChildRelations,
  listParentRelations,
  updateRelation
} from "@/api/relations";
import { listPrinters } from "@/api/printers";
import { printLabel } from "@/api/labelPrint";
import { getRuntimeConfig } from "@/config/runtime";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";

const relationTypes = ["installed_in", "uses", "paired_with"] as const;

const ItemDetailPage = () => {
  const params = useParams({ from: "/items/$itemId" });
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [deleting, setDeleting] = useState(false);

  const [childItemId, setChildItemId] = useState("");
  const [relationType, setRelationType] = useState<(typeof relationTypes)[number]>("installed_in");
  const [quantity, setQuantity] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [relationId, setRelationId] = useState("");
  const [detachLocationId, setDetachLocationId] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [printStatus, setPrintStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);
  const [includeDeletedRelations, setIncludeDeletedRelations] = useState(false);

  const itemQuery = useQuery({
    queryKey: ["item", params.itemId],
    queryFn: () => getItem(params.itemId)
  });

  const childRelationsQuery = useQuery({
    queryKey: ["item", params.itemId, "relations", "children", includeDeletedRelations],
    queryFn: () => listChildRelations(params.itemId, { include_deleted: includeDeletedRelations }),
    enabled: featureFlags.inventory
  });

  const parentRelationsQuery = useQuery({
    queryKey: ["item", params.itemId, "relations", "parents", includeDeletedRelations],
    queryFn: () => listParentRelations(params.itemId, { include_deleted: includeDeletedRelations }),
    enabled: featureFlags.inventory
  });

  const printersQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => listPrinters(),
    enabled: featureFlags.labelPrinting
  });

  const item = itemQuery.data;
  const propsEntries = item?.props ? Object.entries(item.props) : [];
  const effectivePath = item?.location?.effective_location_path ?? [];
  const effectiveLocationName =
    effectivePath.length > 0 ? effectivePath[effectivePath.length - 1].name : item?.location?.effective_location_id ?? "-";

  const attachRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const detachRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const attachFields = useMemo(() => ["child_item_id", "relation_type", "quantity", "slot", "notes"], []);
  const detachFields = useMemo(() => ["relation_id", "location_id"], []);

  const focusAttach = (key: string) => {
    const node = attachRefs.current[key];
    node?.focus();
    if (node && "select" in node) node.select();
  };

  const focusDetach = (key: string) => {
    const node = detachRefs.current[key];
    node?.focus();
    if (node && "select" in node) node.select();
  };

  const advanceAttach = (current: string) => {
    const index = attachFields.indexOf(current);
    const next = attachFields[index + 1];
    if (next) {
      focusAttach(next);
    } else {
      void submitAttach();
    }
  };

  const advanceDetach = (current: string) => {
    const index = detachFields.indexOf(current);
    const next = detachFields[index + 1];
    if (next) {
      focusDetach(next);
    } else {
      void submitDetach();
    }
  };

  const submitAttach = async () => {
    if (!childItemId.trim()) {
      error("Missing child", "Scan or enter a child item id.");
      return;
    }
    try {
      await createRelation(params.itemId, {
        child_item_id: childItemId.trim(),
        relation_type: relationType,
        quantity: quantity && !Number.isNaN(Number(quantity)) ? Number(quantity) : null,
        slot: slot.trim() || null,
        notes: notes.trim() || null
      });
      success("Relation attached", `${params.itemId} -> ${childItemId}`);
      setChildItemId("");
      setQuantity("");
      setSlot("");
      setNotes("");
      childRelationsQuery.refetch();
      focusAttach("child_item_id");
    } catch (err) {
      error("Attach failed", parseErrorMessage(err));
    }
  };

  const submitDetach = async () => {
    if (!relationId.trim()) {
      error("Missing relation", "Scan or enter a relation id.");
      return;
    }
    try {
      await detachRelation(relationId.trim(), {
        location_id: detachLocationId.trim() || null
      });
      success("Relation detached", relationId.trim());
      setRelationId("");
      setDetachLocationId("");
      childRelationsQuery.refetch();
      parentRelationsQuery.refetch();
      focusDetach("relation_id");
    } catch (err) {
      error("Detach failed", parseErrorMessage(err));
    }
  };

  const toggleActive = async (relationIdValue: string, active: boolean) => {
    try {
      await updateRelation(relationIdValue, { active: !active });
      success("Relation updated", relationIdValue);
      childRelationsQuery.refetch();
      parentRelationsQuery.refetch();
    } catch (err) {
      error("Update failed", parseErrorMessage(err));
    }
  };

  const removeRelation = async (relationIdValue: string) => {
    const confirmed = window.confirm("Delete this relation? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    try {
      await deleteRelation(relationIdValue);
      success("Relation deleted", relationIdValue);
      childRelationsQuery.refetch();
      parentRelationsQuery.refetch();
    } catch (err) {
      error("Delete failed", parseErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = window.confirm("Delete this item? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteItem(params.itemId);
      success("Item deleted", params.itemId);
      window.location.assign("/items/list");
    } catch (err) {
      error("Delete failed", parseErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const submitPrint = async () => {
    if (!printerId.trim()) {
      error("Missing printer", "Select a printer to print the item label.");
      return;
    }
    setPrintStatus(null);
    try {
      await printLabel({
        printer_id: printerId.trim(),
        item_id: params.itemId,
        location_id: null
      });
      success("Print queued", params.itemId);
      setPrintStatus({ kind: "success", title: "Print queued", message: printerId.trim() });
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Print failed", message);
      setPrintStatus({ kind: "error", title: "Print failed", message });
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Inventory is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      {itemQuery.isError && (
        <StatusBanner kind="error" title="Item load failed" message={parseErrorMessage(itemQuery.error)} />
      )}

      <div className="detail-grid">
        <Card className="detail-card">
          <div className="card__header">
            <div>
              <h2>{item?.type?.name ?? "Item"}</h2>
              {item?.id && <div className="muted">{item.id}</div>}
            </div>
            <div className="builder__actions">
              <Link to="/move" className="button button--outline button--sm">
                Move Item
              </Link>
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting || !item?.id}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
          <div className="detail-meta">
            <div className="detail-meta__row">
              <span className="detail-meta__label">Type</span>
              <span>{item?.type?.name ?? item?.type_id}</span>
            </div>
            <div className="detail-meta__row">
              <span className="detail-meta__label">Status</span>
              <span>{item?.status ?? "stored"}</span>
            </div>
            <div className="detail-meta__row">
              <span className="detail-meta__label">Effective Location</span>
              <span>{effectiveLocationName}</span>
            </div>
            <div className="detail-meta__row">
              <span className="detail-meta__label">Physical Location</span>
              <span>{item?.location?.physical_location_id ?? "-"}</span>
            </div>
            {effectivePath.length > 0 && <Breadcrumbs path={effectivePath} />}
          </div>
          {item?.description && <div className="detail-description">{item.description}</div>}
        </Card>

        <Card className="detail-card">
          <div className="card__header">
            <h3>Properties</h3>
          </div>
          {propsEntries.length === 0 && <div className="empty">No props stored.</div>}
          {propsEntries.length > 0 && (
            <div className="props-grid">
              {propsEntries.map(([key, value]) => (
                <div key={key} className="props-row">
                  <div className="props-row__key">{key}</div>
                  <div className="props-row__value">{JSON.stringify(value)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {featureFlags.labelPrinting && (
          <Card className="detail-card">
            <div className="card__header">
              <h3>Print Label</h3>
            </div>
            <div className="form-stack">
              <Select
                value={printerId}
                onChange={(event) => setPrinterId(event.target.value)}
                help="Choose the printer that will receive the label print job."
              >
                <option value="">Select printer</option>
                {printersQuery.data?.map((printer) => (
                  <option key={printer.id} value={printer.id}>
                    {printer.id} {printer.name ? `- ${printer.name}` : ""}
                  </option>
                ))}
              </Select>
              {printersQuery.isError && (
                <StatusBanner kind="error" title="Printers failed" message={parseErrorMessage(printersQuery.error)} />
              )}
              <Button onClick={submitPrint} disabled={!item?.id}>
                Print Label
              </Button>
              {printStatus && <StatusBanner kind={printStatus.kind} title={printStatus.title} message={printStatus.message} />}
            </div>
          </Card>
        )}

        <Card className="detail-card">
          <div className="card__header">
            <h3>Attach Item</h3>
          </div>
          <div className="form-stack">
            <Input
              placeholder="Child item id"
              value={childItemId}
              onChange={(event) => setChildItemId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceAttach("child_item_id");
                }
              }}
              help="Scan the child item UUID to attach it to this item."
              ref={(node) => {
                attachRefs.current.child_item_id = node;
              }}
            />
            <Select
              value={relationType}
              onChange={(event) => setRelationType(event.target.value as (typeof relationTypes)[number])}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceAttach("relation_type");
                }
              }}
              help="Choose the relationship type used to describe the attachment."
              ref={(node) => {
                attachRefs.current.relation_type = node;
              }}
            >
              {relationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Quantity (optional)"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceAttach("quantity");
                }
              }}
              help="Enter a count if you are attaching multiple identical children."
              ref={(node) => {
                attachRefs.current.quantity = node;
              }}
            />
            <Input
              placeholder="Slot (optional)"
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceAttach("slot");
                }
              }}
              help="Use a slot or position label to capture where it sits on the parent."
              ref={(node) => {
                attachRefs.current.slot = node;
              }}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceAttach("notes");
                }
              }}
              help="Add any extra context or notes for this attachment."
              ref={(node) => {
                attachRefs.current.notes = node;
              }}
            />
            <Button onClick={submitAttach}>Attach</Button>
          </div>
        </Card>

        <Card className="detail-card">
          <div className="card__header">
            <h3>Detach Relation</h3>
          </div>
          <div className="form-stack">
            <Input
              placeholder="Relation id"
              value={relationId}
              onChange={(event) => setRelationId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceDetach("relation_id");
                }
              }}
              help="Scan the relation UUID to remove the attachment."
              ref={(node) => {
                detachRefs.current.relation_id = node;
              }}
            />
            <Input
              placeholder="Location id (optional)"
              value={detachLocationId}
              onChange={(event) => setDetachLocationId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  advanceDetach("location_id");
                }
              }}
              help="Choose where to store the detached item; default is the root location."
              ref={(node) => {
                detachRefs.current.location_id = node;
              }}
            />
            <Button variant="outline" onClick={submitDetach}>
              Detach
            </Button>
          </div>
        </Card>

        <Card className="detail-card">
          <div className="card__header">
            <h3>Contained Items</h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeDeletedRelations}
                onChange={(event) => setIncludeDeletedRelations(event.target.checked)}
              />
              <span>Include deleted</span>
            </label>
          </div>
          {childRelationsQuery.isLoading && <div className="empty">Loading relations...</div>}
          {childRelationsQuery.data?.length === 0 && <div className="empty">No contained items.</div>}
          {childRelationsQuery.data && childRelationsQuery.data.length > 0 && (
            <div className="props-grid">
              {childRelationsQuery.data.map((relation) => (
                <div key={relation.id} className="props-row">
                  <div>
                    <div className="props-row__key">{relation.relation_type}</div>
                    <div className="muted">{relation.child_item_id}</div>
                    <div className="muted">Relation {relation.id}</div>
                  </div>
                  <div className="relation-row">
                    <span className="relation-row__badge">{relation.active ? "Active" : "Inactive"}</span>
                    <button className="link-button" onClick={() => {
                      setRelationId(relation.id);
                      focusDetach("relation_id");
                    }}>
                      Detach
                    </button>
                    <button className="link-button" onClick={() => removeRelation(relation.id)}>
                      Delete
                    </button>
                    <button className="link-button" onClick={() => toggleActive(relation.id, relation.active)}>
                      {relation.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="detail-card">
          <div className="card__header">
            <h3>Parent Relations</h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeDeletedRelations}
                onChange={(event) => setIncludeDeletedRelations(event.target.checked)}
              />
              <span>Include deleted</span>
            </label>
          </div>
          {parentRelationsQuery.isLoading && <div className="empty">Loading relations...</div>}
          {parentRelationsQuery.data?.length === 0 && <div className="empty">No parent relations.</div>}
          {parentRelationsQuery.data && parentRelationsQuery.data.length > 0 && (
            <div className="props-grid">
              {parentRelationsQuery.data.map((relation) => (
                <div key={relation.id} className="props-row">
                  <div>
                    <div className="props-row__key">{relation.relation_type}</div>
                    <div className="muted">{relation.parent_item_id}</div>
                    <div className="muted">Relation {relation.id}</div>
                  </div>
                  <div className="relation-row">
                    <span className="relation-row__badge">{relation.active ? "Active" : "Inactive"}</span>
                    <button className="link-button" onClick={() => removeRelation(relation.id)}>
                      Delete
                    </button>
                    <button className="link-button" onClick={() => toggleActive(relation.id, relation.active)}>
                      {relation.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ItemDetailPage;


