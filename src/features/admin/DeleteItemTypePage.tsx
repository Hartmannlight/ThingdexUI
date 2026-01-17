import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteItemType, listItemTypes } from "@/api/itemTypes";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const DeleteItemTypePage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [selectedId, setSelectedId] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const itemTypesQuery = useQuery({
    queryKey: ["item-types", "delete", includeDeleted],
    queryFn: () => listItemTypes({ include_deleted: includeDeleted }),
    enabled: featureFlags.itemTypes
  });

  const submit = async () => {
    if (!selectedId) {
      setStatus({ kind: "warning", title: "Select a type", message: "Choose an item type to delete." });
      return;
    }
    const confirmed = window.confirm("Delete this item type? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await deleteItemType(selectedId);
      success("Item type deleted", selectedId);
      setStatus({ kind: "success", title: "Deleted", message: "Item type deleted." });
      setSelectedId("");
      itemTypesQuery.refetch();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Delete failed", message);
      setStatus({ kind: "error", title: "Delete failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!featureFlags.itemTypes) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Item type management is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Delete Item Type</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            help="Select the item type you want to delete."
          >
            <option value="">Select item type</option>
            {itemTypesQuery.data?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
          <label className="toggle">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
            />
            <span>Include deleted</span>
          </label>
          {itemTypesQuery.isError && (
            <StatusBanner kind="error" title="Types failed" message={parseErrorMessage(itemTypesQuery.error)} />
          )}
          <Button size="lg" variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete Item Type"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteItemTypePage;
