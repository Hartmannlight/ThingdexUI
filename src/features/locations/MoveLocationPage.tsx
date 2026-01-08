import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { updateLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const MoveLocationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const rootLocationId = useBootstrapRootLocation();
  const [locationId, setLocationId] = useState("");
  const [parentId, setParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(
    null
  );

  const locationRef = useRef<HTMLInputElement | null>(null);
  const parentRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    locationRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!parentId && rootLocationId) {
      setParentId(rootLocationId);
    }
  }, [parentId, rootLocationId]);

  const submit = async () => {
    if (!locationId.trim()) {
      error("Missing location", "Scan or enter the location UUID to move.");
      locationRef.current?.focus();
      return;
    }
    if (!parentId.trim()) {
      error("Missing parent", "Scan or enter the destination parent UUID.");
      parentRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await updateLocation(locationId.trim(), { parent_id: parentId.trim() });
      success("Location moved", locationId.trim());
      setStatus({ kind: "success", title: "Move complete", message: "Ready for next scan." });
      setLocationId("");
      setParentId(rootLocationId ?? "");
      locationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Move failed", message);
      setStatus({ kind: "error", title: "Move failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onLocationEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      parentRef.current?.focus();
    }
  };

  const onParentEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Move location is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Move Location</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Location UUID"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            onKeyDown={onLocationEnter}
            help="Scan the location UUID you want to move."
            ref={locationRef}
          />
          <Input
            className="input--lg"
            placeholder="Destination parent UUID"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            onKeyDown={onParentEnter}
            help="Scan the new parent location UUID; Enter confirms the move."
            ref={parentRef}
          />
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Moving..." : "Move Location"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MoveLocationPage;
