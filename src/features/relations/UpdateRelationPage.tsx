import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { updateRelation } from "@/api/relations";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const UpdateRelationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [relationId, setRelationId] = useState("");
  const [active, setActive] = useState("true");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const relationRef = useRef<HTMLInputElement | null>(null);
  const activeRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    relationRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!relationId.trim()) {
      error("Missing relation", "Scan or enter relation UUID.");
      relationRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await updateRelation(relationId.trim(), { active: active === "true" });
      success("Relation updated", relationId.trim());
      setStatus({ kind: "success", title: "Updated", message: "Ready for next scan." });
      setRelationId("");
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

  const onActiveEnter = (event: KeyboardEvent<HTMLSelectElement>) => {
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
            help="Choose whether the relation should remain active or be disabled."
            ref={activeRef}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UpdateRelationPage;
