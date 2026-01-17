import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteRelation, updateRelation } from "@/api/relations";
import type { ItemRelationUpdate } from "@/api/types";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const UpdateRelationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [relationId, setRelationId] = useState("");
  const [active, setActive] = useState("keep");
  const [quantity, setQuantity] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const relationRef = useRef<HTMLInputElement | null>(null);
  const activeRef = useRef<HTMLSelectElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);
  const slotRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    relationRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!relationId.trim()) {
      error("Missing relation", "Scan or enter relation UUID.");
      relationRef.current?.focus();
      return;
    }
    const payload: ItemRelationUpdate = {};
    if (active !== "keep") {
      payload.active = active === "true";
    }
    if (quantity.trim()) {
      const parsed = Number(quantity);
      if (Number.isNaN(parsed)) {
        error("Invalid quantity", "Quantity must be a number.");
        quantityRef.current?.focus();
        return;
      }
      payload.quantity = parsed;
    }
    if (slot.trim()) {
      payload.slot = slot.trim();
    }
    if (notes.trim()) {
      payload.notes = notes.trim();
    }
    if (Object.keys(payload).length === 0) {
      setStatus({ kind: "warning", title: "No changes", message: "Enter at least one field to update." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await updateRelation(relationId.trim(), payload);
      success("Relation updated", relationId.trim());
      setStatus({ kind: "success", title: "Updated", message: "Ready for next scan." });
      setRelationId("");
      setActive("keep");
      setQuantity("");
      setSlot("");
      setNotes("");
      relationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Update failed", message);
      setStatus({ kind: "error", title: "Update failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onRelationEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      activeRef.current?.focus();
    }
  };

  const handleDelete = async () => {
    if (!relationId.trim()) {
      error("Missing relation", "Scan or enter relation UUID.");
      relationRef.current?.focus();
      return;
    }
    const confirmed = window.confirm("Delete this relation? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await deleteRelation(relationId.trim());
      success("Relation deleted", relationId.trim());
      setStatus({ kind: "success", title: "Deleted", message: "Relation deleted." });
      setRelationId("");
      setActive("keep");
      setQuantity("");
      setSlot("");
      setNotes("");
      relationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Delete failed", message);
      setStatus({ kind: "error", title: "Delete failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onActiveEnter = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      quantityRef.current?.focus();
    }
  };

  const onQuantityEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      slotRef.current?.focus();
    }
  };

  const onSlotEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      notesRef.current?.focus();
    }
  };

  const onNotesEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Relations are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Update Relation</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Relation UUID"
            value={relationId}
            onChange={(event) => setRelationId(event.target.value)}
            onKeyDown={onRelationEnter}
            help="Scan the relation UUID you want to enable or disable."
            ref={relationRef}
          />
          <Select
            value={active}
            onChange={(event) => setActive(event.target.value)}
            onKeyDown={onActiveEnter}
            help="Set the active state; choose keep to leave it unchanged."
            ref={activeRef}
          >
            <option value="keep">Keep current</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Input
            placeholder="Quantity (optional)"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            onKeyDown={onQuantityEnter}
            help="Update the quantity value; leave blank to keep current."
            ref={quantityRef}
          />
          <Input
            placeholder="Slot (optional)"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            onKeyDown={onSlotEnter}
            help="Update the slot label; leave blank to keep current."
            ref={slotRef}
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onKeyDown={onNotesEnter}
            help="Update notes; leave blank to keep current."
            ref={notesRef}
          />
          <div className="builder__actions">
            <Button size="lg" onClick={submit} disabled={submitting}>
              {submitting ? "Updating..." : "Update"}
            </Button>
            <Button variant="danger" size="lg" onClick={handleDelete} disabled={submitting}>
              Delete Relation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdateRelationPage;
