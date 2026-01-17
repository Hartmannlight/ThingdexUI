import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const DeleteLocationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [locationId, setLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!locationId.trim()) {
      setStatus({ kind: "warning", title: "Missing location", message: "Scan or enter location UUID." });
      inputRef.current?.focus();
      return;
    }
    const confirmed = window.confirm("Delete this location? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await deleteLocation(locationId.trim());
      success("Location deleted", locationId.trim());
      setStatus({ kind: "success", title: "Deleted", message: "Ready for next scan." });
      setLocationId("");
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
          <h2>Delete Location</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Location UUID"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            onKeyDown={onEnter}
            help="Scan the location UUID you want to delete (soft delete)."
            ref={inputRef}
          />
          <Button size="lg" variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete Location"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteLocationPage;
