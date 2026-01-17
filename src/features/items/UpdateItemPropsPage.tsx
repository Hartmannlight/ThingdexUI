import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { Textarea } from "@/components/Textarea";
import { mergeItemProps, replaceItemProps } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const UpdateItemPropsPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [itemId, setItemId] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [propsText, setPropsText] = useState("{}");
  const [propsError, setPropsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);

  const itemRef = useRef<HTMLInputElement | null>(null);
  const modeRef = useRef<HTMLSelectElement | null>(null);
  const propsRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    itemRef.current?.focus();
  }, []);

  const parseProps = () => {
    try {
      const parsed = JSON.parse(propsText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setPropsError("Props must be a JSON object.");
        return null;
      }
      setPropsError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setPropsError("Invalid JSON.");
      return null;
    }
  };

  const submit = async () => {
    if (!itemId.trim()) {
      error("Missing item", "Scan or enter item UUID.");
      itemRef.current?.focus();
      return;
    }
    const props = parseProps();
    if (!props) {
      propsRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      if (mode === "merge") {
        await mergeItemProps(itemId.trim(), { props });
      } else {
        await replaceItemProps(itemId.trim(), { props });
      }
      success("Props updated", itemId.trim());
      setStatus({ kind: "success", title: "Updated", message: "Ready for next scan." });
      setItemId("");
      setPropsText("{}");
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
      modeRef.current?.focus();
    }
  };

  const onModeEnter = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      propsRef.current?.focus();
    }
  };

  const onPropsEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
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
          <h2>Update Item Props</h2>
        </div>
        {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        <div className="form-stack">
          <Input
            className="input--lg"
            placeholder="Item UUID"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            onKeyDown={onItemEnter}
            help="Scan the item UUID; this identifies which item's properties will be changed."
            ref={itemRef}
          />
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value as "merge" | "replace")}
            onKeyDown={onModeEnter}
            help="Choose how changes apply: merge adds/updates fields, replace overwrites all props."
            ref={modeRef}
          >
            <option value="merge">Merge props</option>
            <option value="replace">Replace props</option>
          </Select>
          <Textarea
            mono
            value={propsText}
            onChange={(event) => {
              setPropsText(event.target.value);
              setPropsError(null);
            }}
            onKeyDown={onPropsEnter}
            help="Paste the JSON object that should be stored on the item."
            ref={propsRef}
          />
          {propsError && <StatusBanner kind="error" title="Props error" message={propsError} />}
          <div className="muted">Press Enter to submit; Shift+Enter adds a newline.</div>
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Updating..." : "Update Props"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UpdateItemPropsPage;
