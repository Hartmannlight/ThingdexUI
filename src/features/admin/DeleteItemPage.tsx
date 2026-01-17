import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteItem } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const DeleteItemPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [itemId, setItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!itemId.trim()) {
      setStatus({ kind: "warning", title: "Missing item", message: "Scan or enter item UUID." });
      inputRef.current?.focus();
      return;
    }
    const confirmed = window.confirm("Delete this item? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await deleteItem(itemId.trim());
      success("Item deleted", itemId.trim());
      setStatus({ kind: "success", title: "Deleted", message: "Ready for next scan." });
      setItemId("");
      inputRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Delete failed", message);
      setStatus({ kind: "error", title: "Delete failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
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
      <Card className="card--focus">
        <div className="card__header">
          <h2>Delete Item</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Item UUID"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            onKeyDown={onEnter}
            help="Scan the item UUID you want to delete (soft delete)."
            ref={inputRef}
          />
          <Button size="lg" variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete Item"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteItemPage;
