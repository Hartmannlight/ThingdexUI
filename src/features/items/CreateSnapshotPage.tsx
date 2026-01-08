import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { Textarea } from "@/components/Textarea";
import { createItemSnapshot } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const CreateSnapshotPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [itemId, setItemId] = useState("");
  const [kind, setKind] = useState("");
  const [dataText, setDataText] = useState("");
  const [dataJson, setDataJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const itemRef = useRef<HTMLInputElement | null>(null);
  const kindRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const jsonRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    itemRef.current?.focus();
  }, []);

  const parseJson = () => {
    if (!dataJson.trim()) return null;
    try {
      const parsed = JSON.parse(dataJson);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("Data JSON must be an object.");
        return null;
      }
      setJsonError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setJsonError("Invalid JSON.");
      return null;
    }
  };

  const submit = async () => {
    if (!itemId.trim()) {
      error("Missing item", "Scan or enter item UUID.");
      itemRef.current?.focus();
      return;
    }
    if (!kind.trim()) {
      error("Missing kind", "Provide a snapshot kind.");
      kindRef.current?.focus();
      return;
    }
    const data = parseJson();
    if (dataJson.trim() && !data) {
      jsonRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await createItemSnapshot(itemId.trim(), {
        kind: kind.trim(),
        data_text: dataText.trim() || null,
        data: data ?? null
      });
      success("Snapshot created", itemId.trim());
      setStatus({ kind: "success", title: "Snapshot saved", message: "Ready for next scan." });
      setItemId("");
      setKind("");
      setDataText("");
      setDataJson("");
      itemRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Snapshot failed", message);
      setStatus({ kind: "error", title: "Snapshot failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const onItemEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      kindRef.current?.focus();
    }
  };

  const onKindEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      textRef.current?.focus();
    }
  };

  if (!featureFlags.snapshots) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Snapshots are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Create Snapshot</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Item UUID"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            onKeyDown={onItemEnter}
            help="Scan the item UUID so the snapshot is linked to the correct item."
            ref={itemRef}
          />
          <Input
            placeholder="Snapshot kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            onKeyDown={onKindEnter}
            help="Enter a short label to identify this snapshot later."
            ref={kindRef}
          />
          <Textarea
            mono
            placeholder="Data text (optional)"
            value={dataText}
            onChange={(event) => setDataText(event.target.value)}
            help="Optional raw text to store alongside the snapshot for quick viewing."
            ref={textRef}
          />
          <Textarea
            mono
            placeholder="Data JSON (optional)"
            value={dataJson}
            onChange={(event) => {
              setDataJson(event.target.value);
              setJsonError(null);
            }}
            help="Optional JSON object to store structured snapshot data."
            ref={jsonRef}
          />
          {jsonError && <StatusBanner kind="error" title="JSON error" message={jsonError} />}
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Snapshot"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateSnapshotPage;
