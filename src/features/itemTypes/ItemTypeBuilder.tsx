import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Card } from "@/components/Card";
import { StatusBanner } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { Textarea } from "@/components/Textarea";
import { createItemType } from "@/api/itemTypes";
import { listLabelTemplates } from "@/api/labels";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";
import { getRuntimeConfig } from "@/config/runtime";

const fieldTypes = ["string", "integer", "number", "boolean", "date", "date-time"] as const;

export type FieldDef = {
  id: string;
  key: string;
  label: string;
  type: (typeof fieldTypes)[number];
  required: boolean;
  enumCsv: string;
  min: string;
  max: string;
  pattern: string;
  unit: string;
  defaultValue: string;
  trackHistory: boolean;
  help: string;
  group: string;
  order: string;
};

const schemaSpec = {
  type: "object",
  required: ["fields"],
  properties: {
    fields: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["type"],
        properties: {
          type: { enum: fieldTypes },
          label: { type: "string" },
          required: { type: "boolean" },
          enum: { type: "array", items: { type: "string" } },
          min: { type: "number" },
          max: { type: "number" },
          pattern: { type: "string" },
          unit: { type: "string" },
          default: {},
          track_history: { type: "boolean" },
          help: { type: "string" },
          group: { type: "string" },
          order: { type: "number" }
        }
      }
    }
  }
};

let fieldIdCounter = 0;

const nextFieldId = () => `field-${fieldIdCounter++}`;

const defaultField = (): FieldDef => ({
  id: nextFieldId(),
  key: "",
  label: "",
  type: "string",
  required: false,
  enumCsv: "",
  min: "",
  max: "",
  pattern: "",
  unit: "",
  defaultValue: "",
  trackHistory: false,
  help: "",
  group: "",
  order: ""
});

const parseDefaultValue = (value: string, type: FieldDef["type"]) => {
  if (!value.trim()) return undefined;
  if (type === "integer" || type === "number") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (type === "boolean") {
    return value.trim().toLowerCase() === "true";
  }
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const schemaToFields = (schema: Record<string, unknown>) => {
  const errors: string[] = [];
  const fieldsRaw = schema.fields;
  if (!isRecord(fieldsRaw)) {
    return { errors: ["Schema must include a fields object."] };
  }

  const fields: FieldDef[] = Object.entries(fieldsRaw).map(([key, config]) => {
    if (!isRecord(config)) {
      errors.push(`Field ${key}: must be an object.`);
      return { ...defaultField(), key };
    }
    const typeValue = String(config.type ?? "");
    if (!fieldTypes.includes(typeValue as FieldDef["type"])) {
      errors.push(`Field ${key}: invalid type "${typeValue}".`);
    }
    const enumValue = Array.isArray(config.enum) ? config.enum : [];
    if (config.enum !== undefined && !Array.isArray(config.enum)) {
      errors.push(`Field ${key}: enum must be an array of strings.`);
    }
    return {
      id: nextFieldId(),
      key,
      label: typeof config.label === "string" ? config.label : "",
      type: fieldTypes.includes(typeValue as FieldDef["type"]) ? (typeValue as FieldDef["type"]) : "string",
      required: Boolean(config.required),
      enumCsv: enumValue.map((value) => String(value)).join(","),
      min: config.min !== undefined ? String(config.min) : "",
      max: config.max !== undefined ? String(config.max) : "",
      pattern: typeof config.pattern === "string" ? config.pattern : "",
      unit: typeof config.unit === "string" ? config.unit : "",
      defaultValue: config.default !== undefined ? String(config.default) : "",
      trackHistory: Boolean(config.track_history),
      help: typeof config.help === "string" ? config.help : "",
      group: typeof config.group === "string" ? config.group : "",
      order: config.order !== undefined ? String(config.order) : ""
    };
  });

  return { errors, fields };
};

export const ItemTypeBuilder = ({ onCreated }: { onCreated: () => void }) => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [name, setName] = useState("");
  const [labelTemplateId, setLabelTemplateId] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([defaultField()]);
  const [submitting, setSubmitting] = useState(false);
  const [schemaText, setSchemaText] = useState("");
  const [schemaDirty, setSchemaDirty] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const schemaPreview = useMemo(() => {
    const fieldsMap: Record<string, Record<string, unknown>> = {};
    fields.forEach((field) => {
      if (!field.key.trim()) return;
      const entry: Record<string, unknown> = {
        type: field.type
      };
      if (field.label.trim()) entry.label = field.label.trim();
      if (field.required) entry.required = true;
      if (field.enumCsv.trim()) {
        entry.enum = field.enumCsv
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      }
      if (field.min.trim()) entry.min = Number(field.min);
      if (field.max.trim()) entry.max = Number(field.max);
      if (field.pattern.trim()) entry.pattern = field.pattern.trim();
      if (field.unit.trim()) entry.unit = field.unit.trim();
      if (field.defaultValue.trim()) entry.default = parseDefaultValue(field.defaultValue, field.type);
      if (field.trackHistory) entry.track_history = true;
      if (field.help.trim()) entry.help = field.help.trim();
      if (field.group.trim()) entry.group = field.group.trim();
      if (field.order.trim()) entry.order = Number(field.order);
      fieldsMap[field.key.trim()] = entry;
    });
    return {
      fields: fieldsMap
    };
  }, [fields]);

  useEffect(() => {
    if (!schemaDirty) {
      setSchemaText(JSON.stringify(schemaPreview, null, 2));
    }
  }, [schemaPreview, schemaDirty]);

  const templatesQuery = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => listLabelTemplates(),
    enabled: featureFlags.labelPrinting
  });

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    setFields((current) => current.map((field, idx) => (idx === index ? { ...field, ...updates } : field)));
  };

  const addField = () => {
    setFields((current) => [...current, defaultField()]);
  };

  const removeField = (index: number) => {
    setFields((current) => current.filter((_, idx) => idx !== index));
  };

  const applySchemaJson = () => {
    try {
      const parsed = JSON.parse(schemaText);
      if (!isRecord(parsed)) {
        setSchemaError("Schema JSON must be an object.");
        return;
      }
      const result = schemaToFields(parsed);
      if (result.errors.length > 0) {
        setSchemaError(result.errors.join(" "));
        return;
      }
      setFields(result.fields ?? [defaultField()]);
      setSchemaError(null);
      setSchemaDirty(false);
      success("Schema applied", "Fields updated from JSON.");
    } catch {
      setSchemaError("Invalid JSON. Please fix syntax errors.");
    }
  };

  const syncSchemaFromForm = () => {
    setSchemaText(JSON.stringify(schemaPreview, null, 2));
    setSchemaDirty(false);
    setSchemaError(null);
  };

  const submit = async () => {
    if (!name.trim()) {
      error("Missing name", "Item type name is required.");
      return;
    }
    if (schemaDirty) {
      error("Schema not applied", "Apply the JSON schema to the form before creating.");
      return;
    }
    setSubmitting(true);
    try {
      await createItemType({
        name: name.trim(),
        schema: schemaPreview,
        ui: {},
        label_template_id: labelTemplateId.trim() || null
      });
      success("Item type created", name.trim());
      setName("");
      setLabelTemplateId("");
      setFields([defaultField()]);
      setSchemaError(null);
      setSchemaDirty(false);
      onCreated();
    } catch (err) {
      error("Create failed", parseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="builder">
      <div className="card__header">
        <h3>Create Item Type</h3>
        <Button size="sm" variant="outline" onClick={addField}>
          Add Field
        </Button>
      </div>
      <div className="form-stack">
        <Input
          className="input--lg"
          placeholder="Type name (e.g., storage_drive)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          help="Define the item type name used across lists, search, and item creation."
        />
        {featureFlags.labelPrinting && (
          <>
            <Select
              value={labelTemplateId}
              onChange={(event) => setLabelTemplateId(event.target.value)}
              help="Choose the label template that will be used when printing this item type."
            >
              <option value="">Label template (optional)</option>
              {templatesQuery.data?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.id} {template.name ? `- ${template.name}` : ""}
                </option>
              ))}
            </Select>
            {templatesQuery.isError && (
              <StatusBanner kind="error" title="Templates failed" message={parseErrorMessage(templatesQuery.error)} />
            )}
          </>
        )}
    <div className="builder__fields">
      {fields.map((field, index) => (
        <div className="builder__row" key={field.id}>
              <Input
                placeholder="Key"
                value={field.key}
                onChange={(event) => updateField(index, { key: event.target.value })}
                help="The JSON key used to store this field in item properties."
              />
              <Input
                placeholder="Label"
                value={field.label}
                onChange={(event) => updateField(index, { label: event.target.value })}
                help="The user-facing label shown on forms and detail views."
              />
              <Select
                value={field.type}
                onChange={(event) => updateField(index, { type: event.target.value as FieldDef["type"] })}
                help="Select the data type to control validation and input rendering."
              >
                {fieldTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => updateField(index, { required: event.target.checked })}
                />
                <span>Required</span>
                <HelpIcon text="Require this field during item creation and validation." />
              </label>
              <Input
                placeholder="Enum (a,b,c)"
                value={field.enumCsv}
                onChange={(event) => updateField(index, { enumCsv: event.target.value })}
                help="Comma-separated list of allowed values; users must pick from this set."
              />
              <Input
                placeholder="Min"
                value={field.min}
                onChange={(event) => updateField(index, { min: event.target.value })}
                help="Minimum numeric value allowed for this field."
              />
              <Input
                placeholder="Max"
                value={field.max}
                onChange={(event) => updateField(index, { max: event.target.value })}
                help="Maximum numeric value allowed for this field."
              />
              <Input
                placeholder="Pattern"
                value={field.pattern}
                onChange={(event) => updateField(index, { pattern: event.target.value })}
                help="Regex pattern the value must match (advanced validation)."
              />
              <Input
                placeholder="Unit"
                value={field.unit}
                onChange={(event) => updateField(index, { unit: event.target.value })}
                help="Optional unit label shown next to the value (e.g., mm, kg)."
              />
              <Input
                placeholder="Default"
                value={field.defaultValue}
                onChange={(event) => updateField(index, { defaultValue: event.target.value })}
                help="Default value used when the user leaves the field blank."
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={field.trackHistory}
                  onChange={(event) => updateField(index, { trackHistory: event.target.checked })}
                />
                <span>Track</span>
                <HelpIcon text="Record history entries whenever this property changes." />
              </label>
              <Input
                placeholder="Help"
                value={field.help}
                onChange={(event) => updateField(index, { help: event.target.value })}
                help="Guidance shown to users when they fill out this field."
              />
              <Input
                placeholder="Group"
                value={field.group}
                onChange={(event) => updateField(index, { group: event.target.value })}
                help="Group name used to cluster related fields in the UI."
              />
              <Input
                placeholder="Order"
                value={field.order}
                onChange={(event) => updateField(index, { order: event.target.value })}
                help="Numeric order for sorting fields within the UI."
              />
              <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="builder__actions">
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Type"}
          </Button>
        </div>
        <div className="builder__preview">
          <div className="builder__preview-title">Schema Editor</div>
          <Textarea
            mono
            value={schemaText}
            onChange={(event) => {
              setSchemaText(event.target.value);
              setSchemaDirty(true);
              setSchemaError(null);
            }}
            help="Paste schema JSON to populate the form; applying will overwrite current fields."
          />
          <div className="builder__actions">
            <Button size="sm" variant="outline" onClick={applySchemaJson}>
              Apply JSON to Form
            </Button>
            <Button size="sm" variant="ghost" onClick={syncSchemaFromForm}>
              Sync From Form
            </Button>
          </div>
          {schemaError && <StatusBanner kind="error" title="Schema error" message={schemaError} />}
        </div>
        <div className="builder__preview">
          <div className="builder__preview-title">Allowed JSON Schema</div>
          <pre>{JSON.stringify(schemaSpec, null, 2)}</pre>
        </div>
      </div>
    </Card>
  );
};
