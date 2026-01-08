import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { createRelation } from "@/api/relations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const relationTypes = ["installed_in", "uses", "paired_with"] as const;

const AttachItemPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [parentItemId, setParentItemId] = useState("");
  const [childItemId, setChildItemId] = useState("");
  const [relationType, setRelationType] = useState<(typeof relationTypes)[number]>("installed_in");
  const [quantity, setQuantity] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [keepParent, setKeepParent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const refs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const fieldOrder = useMemo(
    () => ["parent_item_id", "child_item_id", "relation_type", "quantity", "slot", "notes"],
    []
  );

  useEffect(() => {
    refs.current.parent_item_id?.focus();
  }, []);

  const focusField = (key: string) => {
    const node = refs.current[key];
    if (node) {
      node.focus();
      if ("select" in node) node.select();
    }
  };

  const advance = (current: string) => {
    const index = fieldOrder.indexOf(current);
    const next = fieldOrder[index + 1];
    if (next) {
      focusField(next);
    } else {
      void submit();
    }
  };

  const onEnter = (key: string) => (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      advance(key);
    }
  };

  const submit = async () => {
    if (!parentItemId.trim()) {
      error("Missing parent", "Scan or enter the parent item UUID.");
      focusField("parent_item_id");
      return;
    }
    if (!childItemId.trim()) {
      error("Missing child", "Scan or enter the child item UUID.");
      focusField("child_item_id");
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await createRelation(parentItemId.trim(), {
        child_item_id: childItemId.trim(),
        relation_type: relationType,
        quantity: quantity.trim() ? Number(quantity) : null,
        slot: slot.trim() || null,
        notes: notes.trim() || null
      });
      success("Relation attached", `${parentItemId} -> ${childItemId}`);
      setStatus({ kind: "success", title: "Attached", message: "Ready for next scan." });
      setChildItemId("");
      setQuantity("");
      setSlot("");
      setNotes("");
      if (!keepParent) {
        setParentItemId("");
        focusField("parent_item_id");
      } else {
        focusField("child_item_id");
      }
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Attach failed", message);
      setStatus({ kind: "error", title: "Attach failed", message });
    } finally {
      setSubmitting(false);
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
          <h2>Attach Item</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Parent item UUID"
            value={parentItemId}
            onChange={(event) => setParentItemId(event.target.value)}
            onKeyDown={onEnter("parent_item_id")}
            help="Scan the parent item UUID that will own or contain the child."
            ref={(node) => {
              refs.current.parent_item_id = node;
            }}
          />
          <Input
            className="input--lg"
            placeholder="Child item UUID"
            value={childItemId}
            onChange={(event) => setChildItemId(event.target.value)}
            onKeyDown={onEnter("child_item_id")}
            help="Scan the child item UUID that will be attached to the parent."
            ref={(node) => {
              refs.current.child_item_id = node;
            }}
          />
          <Select
            value={relationType}
            onChange={(event) => setRelationType(event.target.value as (typeof relationTypes)[number])}
            onKeyDown={onEnter("relation_type")}
            help="Choose the semantic relationship between the parent and child."
            ref={(node) => {
              refs.current.relation_type = node;
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
            onKeyDown={onEnter("quantity")}
            help="If attaching multiple identical children, enter how many."
            ref={(node) => {
              refs.current.quantity = node;
            }}
          />
          <Input
            placeholder="Slot (optional)"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            onKeyDown={onEnter("slot")}
            help="Use a slot/position label to describe where the child sits on the parent."
            ref={(node) => {
              refs.current.slot = node;
            }}
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onKeyDown={onEnter("notes")}
            help="Add a short note for context; it is stored with the relation."
            ref={(node) => {
              refs.current.notes = node;
            }}
          />
          <label className="toggle">
            <input type="checkbox" checked={keepParent} onChange={(event) => setKeepParent(event.target.checked)} />
            <span>Keep parent item</span>
            <HelpIcon text="Keep the parent UUID filled so you can scan multiple children in a row." />
          </label>
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Attaching..." : "Attach"}
          </Button>
        </div>
      </Card>

    </div>
  );
};

export default AttachItemPage;
