import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { listPrinters } from "@/api/printers";
import { getLabelTemplate, isValidLocationTemplate, listLabelTemplates } from "@/api/labels";
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
  const [templateId, setTemplateId] = useState("");
  const [filterValidTemplates, setFilterValidTemplates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);

  const printersQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => listPrinters(),
    enabled: featureFlags.labelPrinting
  });

  const templatesQuery = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => listLabelTemplates(),
    enabled: featureFlags.labelPrinting
  });

  const templateIds = useMemo(() => (templatesQuery.data ?? []).map((template) => template.id), [templatesQuery.data]);
  const filterLocationTemplates = filterValidTemplates && targetKind === "location";

  const templateValidityQuery = useQuery({
    queryKey: ["label-templates", "validity", templateIds],
    queryFn: async () => {
      const entries = await Promise.all(
        templateIds.map(async (templateId) => {
          try {
            const detail = await getLabelTemplate(templateId);
            return { id: templateId, detail };
          } catch {
            return { id: templateId, detail: null };
          }
        })
      );
      return entries;
    },
    enabled: featureFlags.labelPrinting && filterLocationTemplates && templateIds.length > 0
  });

  const validTemplateIds = useMemo(() => {
    const entries = templateValidityQuery.data ?? [];
    return new Set(entries.filter((entry) => isValidLocationTemplate(entry.detail)).map((entry) => entry.id));
  }, [templateValidityQuery.data]);

  const templateOptions = useMemo(() => {
    const templates = templatesQuery.data ?? [];
    if (!filterLocationTemplates) return templates;
    return templates.filter((template) => validTemplateIds.has(template.id));
  }, [templatesQuery.data, filterLocationTemplates, validTemplateIds]);

  useEffect(() => {
    if (filterLocationTemplates && templateId && templateValidityQuery.data && !validTemplateIds.has(templateId)) {
      setTemplateId("");
    }
  }, [filterLocationTemplates, templateId, templateValidityQuery.data, validTemplateIds]);

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
        location_id: targetKind === "location" ? targetId.trim() : null,
        template_id: templateId.trim() || null
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
                {printer.name ?? printer.id}
              </option>
            ))}
          </Select>
          <Select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            help="Optional: override the template used for this label print."
            disabled={filterLocationTemplates && templateValidityQuery.isLoading}
          >
            <option value="">Use default template</option>
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.id} {template.name ? `- ${template.name}` : ""}
              </option>
            ))}
          </Select>
          <label className="toggle">
            <input
              type="checkbox"
              checked={filterValidTemplates}
              onChange={(event) => setFilterValidTemplates(event.target.checked)}
            />
            <span>Only valid templates</span>
          </label>
          {filterLocationTemplates && templateValidityQuery.isLoading && (
            <StatusBanner kind="info" title="Checking templates" message="Validating label templates..." />
          )}
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
