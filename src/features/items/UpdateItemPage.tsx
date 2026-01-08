import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { updateItem } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const UpdateItemPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [itemId, setItemId] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const itemRef = useRef<HTMLInputElement | null>(null);
  const statusRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    itemRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!itemId.trim()) {
      error("Missing item", "Scan or enter item UUID.");
      itemRef.current?.focus();
      return;
    }
    if (!statusValue.trim() && !description.trim()) {
      error("Missing changes", "Provide a status or description.");
      statusRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await updateItem(itemId.trim(), {
        status: statusValue.trim() || null,
        description: description.trim() || null
      });
      success("Item updated", itemId.trim());
      setStatus({ kind: "success", title: "Updated", message: "Ready for next scan." });
      setItemId("");
      setStatusValue("");
      setDescription("");
      itemRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Update failed", message);
      setStatus({ kind: "error", title: "Update failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onItemEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      statusRef.current?.focus();
    }
  };

  const onStatusEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      descRef.current?.focus();
    }
  };

  const onDescEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Item updates are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Update Item</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Item UUID"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            onKeyDown={onItemEnter}
            help="Scan the item UUID; this selects which item will be edited."
            ref={itemRef}
          />
          <Input
            placeholder="Status (optional)"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
            onKeyDown={onStatusEnter}
            help="Set a status label for quick filtering or state notes; leave blank to keep it."
            ref={statusRef}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={onDescEnter}
            help="Store a short note on the item; leave blank to keep the current description."
            ref={descRef}
          />
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UpdateItemPage;
