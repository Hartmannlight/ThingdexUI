import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { listPrinters } from "@/api/printers";
import { printLabel } from "@/api/labelPrint";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

type TargetKind = "item" | "location";

const LabelReprintPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [targetKind, setTargetKind] = useState<TargetKind>("item");
  const [printerId, setPrinterId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);

  const printersQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => listPrinters(),
    enabled: featureFlags.labelPrinting
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const placeholder = useMemo(() => {
    return targetKind === "item" ? "Scan item UUID" : "Scan location UUID";
  }, [targetKind]);

  const submit = async () => {
    if (!printerId.trim()) {
      error("Missing printer", "Select a printer.");
      return;
    }
    if (!targetId.trim()) {
      error("Missing ID", "Scan or enter a UUID.");
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await printLabel({
        printer_id: printerId.trim(),
        item_id: targetKind === "item" ? targetId.trim() : null,
        location_id: targetKind === "location" ? targetId.trim() : null
      });
      success("Print queued", targetId.trim());
      setStatus({ kind: "success", title: "Print queued", message: targetId.trim() });
      setTargetId("");
      inputRef.current?.focus();
    } catch (err) {
      const message = parseErrorMessage(err);
      error("Print failed", message);
      setStatus({ kind: "error", title: "Print failed", message });
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

  if (!featureFlags.labelPrinting) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Label printing is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <Card className="card--focus">
        <div className="card__header">
          <h2>Reprint Label</h2>
        </div>
        <div className="form-stack">
          <Select
            value={targetKind}
            onChange={(event) => setTargetKind(event.target.value as TargetKind)}
            help="Choose whether the scanned UUID belongs to an item or a location."
          >
            <option value="item">Item</option>
            <option value="location">Location</option>
          </Select>
          <Select
            value={printerId}
            onChange={(event) => setPrinterId(event.target.value)}
            help="Select the printer that should receive this reprint job."
          >
            <option value="">Select printer</option>
            {printersQuery.data?.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.id} {printer.name ? `- ${printer.name}` : ""}
              </option>
            ))}
          </Select>
          {printersQuery.isError && (
            <StatusBanner kind="error" title="Printers failed" message={parseErrorMessage(printersQuery.error)} />
          )}
          <Input
            placeholder={placeholder}
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            onKeyDown={onEnter}
            ref={inputRef}
            help="Scan the item or location UUID to reprint its label."
          />
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Printing..." : "Print Label"}
          </Button>
          {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
        </div>
      </Card>
    </div>
  );
};

export default LabelReprintPage;
