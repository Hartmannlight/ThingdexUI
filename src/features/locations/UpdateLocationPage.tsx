import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { Textarea } from "@/components/Textarea";
import { deleteLocation, updateLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const UpdateLocationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [kind, setKind] = useState("");
  const [metaText, setMetaText] = useState("");
  const [metaError, setMetaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const locationRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const parentRef = useRef<HTMLInputElement | null>(null);
  const kindRef = useRef<HTMLInputElement | null>(null);
  const metaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    locationRef.current?.focus();
  }, []);

  const parseMeta = () => {
    if (!metaText.trim()) return null;
    try {
      const parsed = JSON.parse(metaText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setMetaError("Meta must be a JSON object.");
        return null;
      }
      setMetaError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setMetaError("Invalid JSON.");
      return null;
    }
  };

  const submit = async () => {
    if (!locationId.trim()) {
      error("Missing location", "Scan or enter location UUID.");
      locationRef.current?.focus();
      return;
    }
    if (!name.trim() && !parentId.trim() && !kind.trim() && !metaText.trim()) {
      error("Missing changes", "Provide at least one field to update.");
      nameRef.current?.focus();
      return;
    }
    const meta = parseMeta();
    if (metaText.trim() && !meta) {
      metaRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await updateLocation(locationId.trim(), {
        name: name.trim() || null,
        parent_id: parentId.trim() || null,
        kind: kind.trim() || null,
        meta: meta ?? null
      });
      success("Location updated", locationId.trim());
      setStatus({ kind: "success", title: "Updated", message: "Ready for next scan." });
      setLocationId("");
      setName("");
      setParentId("");
      setKind("");
      setMetaText("");
      locationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Update failed", message);
      setStatus({ kind: "error", title: "Update failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!locationId.trim()) {
      error("Missing location", "Scan or enter location UUID.");
      locationRef.current?.focus();
      return;
    }
    const confirmed = window.confirm("Delete this location? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setDeleting(true);
    setStatus(null);
    try {
      await deleteLocation(locationId.trim());
      success("Location deleted", locationId.trim());
      setStatus({ kind: "success", title: "Deleted", message: "Location deleted." });
      setLocationId("");
      setName("");
      setParentId("");
      setKind("");
      setMetaText("");
      locationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Delete failed", message);
      setStatus({ kind: "error", title: "Delete failed", message });
    } finally {
      setDeleting(false);
    }
  };

  const onLocationEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      nameRef.current?.focus();
    }
  };

  const onNameEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      parentRef.current?.focus();
    }
  };

  const onParentEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      kindRef.current?.focus();
    }
  };

  const onKindEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      metaRef.current?.focus();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Location updates are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Update Location</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Location UUID"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            onKeyDown={onLocationEnter}
            help="Scan the location UUID you want to edit; Enter moves to the next field."
            ref={locationRef}
          />
          <Input
            placeholder="Name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={onNameEnter}
            help="Provide a new display name, or leave blank to keep the current name."
            ref={nameRef}
          />
          <Input
            placeholder="Parent UUID (optional)"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            onKeyDown={onParentEnter}
            help="Set a new parent to move this location; leave blank to keep it where it is."
            ref={parentRef}
          />
          <Input
            placeholder="Kind (optional)"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            onKeyDown={onKindEnter}
            help="Optional category tag used for filtering or grouping locations."
            ref={kindRef}
          />
          <Textarea
            mono
            placeholder="Meta JSON (optional)"
            value={metaText}
            onChange={(event) => {
              setMetaText(event.target.value);
              setMetaError(null);
            }}
            help="Optional JSON metadata for advanced behavior (such as label template settings)."
            ref={metaRef}
          />
          {metaError && <StatusBanner kind="error" title="Meta error" message={metaError} />}
          <div className="builder__actions">
            <Button size="lg" onClick={submit} disabled={submitting || deleting}>
              {submitting ? "Updating..." : "Update Location"}
            </Button>
            <Button variant="danger" size="lg" onClick={handleDelete} disabled={submitting || deleting}>
              {deleting ? "Deleting..." : "Delete Location"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdateLocationPage;
