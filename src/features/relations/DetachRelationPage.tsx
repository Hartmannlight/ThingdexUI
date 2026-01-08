import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { detachRelation } from "@/api/relations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const DetachRelationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const rootLocationId = useBootstrapRootLocation();
  const [relationId, setRelationId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const relationRef = useRef<HTMLInputElement | null>(null);
  const locationRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    relationRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!locationId && rootLocationId) {
      setLocationId(rootLocationId);
    }
  }, [locationId, rootLocationId]);

  const submit = async () => {
    if (!relationId.trim()) {
      error("Missing relation", "Scan or enter relation UUID.");
      relationRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await detachRelation(relationId.trim(), {
        location_id: locationId.trim() || null
      });
      success("Relation detached", relationId.trim());
      setStatus({ kind: "success", title: "Detached", message: "Ready for next scan." });
      setRelationId("");
      relationRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Detach failed", message);
      setStatus({ kind: "error", title: "Detach failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onRelationEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      locationRef.current?.focus();
    }
  };

  const onLocationEnter = (event: KeyboardEvent<HTMLInputElement>) => {
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
          <h2>Detach Relation</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Relation UUID"
            value={relationId}
            onChange={(event) => setRelationId(event.target.value)}
            onKeyDown={onRelationEnter}
            help="Scan the relation UUID that should be removed."
            ref={relationRef}
          />
          <Input
            className="input--lg"
            placeholder="Destination location UUID (optional)"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            onKeyDown={onLocationEnter}
            help="Choose where the detached item should be stored; default is the root location."
            ref={locationRef}
          />
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Detaching..." : "Detach"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DetachRelationPage;
