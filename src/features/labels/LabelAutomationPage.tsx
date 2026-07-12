import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createLabelProfile, deleteLabelProfile, listLabelProfiles } from "@/api/labelProfiles";
import { listItemTypes } from "@/api/itemTypes";
import { listLabelTemplates } from "@/api/labels";
import { listPrinters } from "@/api/printers";
import { parseErrorMessage } from "@/api/errors";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const LabelAutomationPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [entityKind, setEntityKind] = useState<"item" | "location">("item");
  const [name, setName] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [locationKind, setLocationKind] = useState("container");
  const [templateId, setTemplateId] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const profiles = useQuery({ queryKey: ["label-profiles"], queryFn: listLabelProfiles, enabled: featureFlags.labelPrinting });
  const itemTypes = useQuery({ queryKey: ["item-types", "label-profiles"], queryFn: () => listItemTypes(), enabled: featureFlags.labelPrinting });
  const templates = useQuery({ queryKey: ["label-templates"], queryFn: listLabelTemplates, enabled: featureFlags.labelPrinting });
  const printers = useQuery({ queryKey: ["printers"], queryFn: listPrinters, enabled: featureFlags.labelPrinting });

  const submit = async () => {
    const selector = entityKind === "item" ? itemTypeId : locationKind.trim();
    if (!selector || !templateId || !printerId) {
      error("Configuration incomplete", "Select a data type, template and printer.");
      return;
    }
    setSubmitting(true);
    try {
      await createLabelProfile({
        name: name.trim() || `${entityKind === "item" ? "Item" : "Location"} label`,
        entity_kind: entityKind,
        item_type_id: entityKind === "item" ? itemTypeId : null,
        location_kind: entityKind === "location" ? locationKind.trim() : null,
        template_id: templateId,
        printer_id: printerId,
        auto_print: true,
        bindings: {},
        enabled: true
      });
      success("Automation enabled", "New records will now print with this rule.");
      setName("");
      await profiles.refetch();
    } catch (err) {
      error("Rule could not be saved", parseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (profileId: string) => {
    try {
      await deleteLabelProfile(profileId);
      success("Automation removed", "New records will no longer use this rule.");
      await profiles.refetch();
    } catch (err) {
      error("Rule could not be removed", parseErrorMessage(err));
    }
  };

  if (!featureFlags.labelPrinting) {
    return <div className="page"><StatusBanner kind="warning" title="Feature disabled" message="Label printing is disabled." /></div>;
  }

  const loadingError = profiles.error || itemTypes.error || templates.error || printers.error;
  return (
    <div className="page">
      <div>
        <h1>Automatic labels</h1>
        <div className="muted">Configure this once. Creating an item or location then queues its label automatically.</div>
      </div>
      {loadingError && <StatusBanner kind="error" title="PrintHub data unavailable" message={parseErrorMessage(loadingError)} />}
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header"><h2>New rule</h2></div>
          <div className="form-stack">
            <Select value={entityKind} onChange={(event) => setEntityKind(event.target.value as "item" | "location")}>
              <option value="item">When an item is created</option>
              <option value="location">When a location is created</option>
            </Select>
            {entityKind === "item" ? (
              <Select value={itemTypeId} onChange={(event) => setItemTypeId(event.target.value)}>
                <option value="">Select item type</option>
                {itemTypes.data?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </Select>
            ) : (
              <Input value={locationKind} onChange={(event) => setLocationKind(event.target.value)} placeholder="Location kind, e.g. container" help="Use * to apply one default to every location kind." />
            )}
            <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">Select template</option>
              {templates.data?.map((template) => <option key={template.id} value={template.id}>{template.name || template.id}</option>)}
            </Select>
            <Select value={printerId} onChange={(event) => setPrinterId(event.target.value)}>
              <option value="">Select printer</option>
              {printers.data?.map((printer) => <option key={printer.id} value={printer.id}>{printer.name || printer.id}</option>)}
            </Select>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rule name (optional)" />
            <Button size="lg" onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Enable automatic printing"}</Button>
          </div>
        </Card>
        <Card>
          <div className="card__header"><h2>Active rules</h2></div>
          <div className="form-stack">
            {profiles.isLoading && <div className="muted">Loading rules...</div>}
            {profiles.data?.length === 0 && <div className="muted">No automatic labels configured.</div>}
            {profiles.data?.map((profile) => {
              const itemType = itemTypes.data?.find((type) => type.id === profile.item_type_id);
              return (
                <div className="card" key={profile.id}>
                  <div className="card__header">
                    <div><strong>{profile.name}</strong><div className="muted">{profile.entity_kind === "item" ? itemType?.name || profile.item_type_id : profile.location_kind}</div></div>
                    <Button size="sm" variant="danger" onClick={() => remove(profile.id)}>Remove</Button>
                  </div>
                  <div className="muted">{profile.template_id} → {profile.printer_id}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LabelAutomationPage;
