import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { listItemTypes } from "@/api/itemTypes";
import { createItem } from "@/api/items";
import { getLabelTemplate } from "@/api/labels";
import { listPrinters } from "@/api/printers";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const CreateItemsPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const rootLocationId = useBootstrapRootLocation();
  const [includeDeletedTypes, setIncludeDeletedTypes] = useState(false);

  const itemTypesQuery = useQuery({
    queryKey: ["item-types", includeDeletedTypes],
    queryFn: () => listItemTypes({ include_deleted: includeDeletedTypes }),
    enabled: featureFlags.createItems
  });

  const [typeId, setTypeId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [hasPhysicalLocation, setHasPhysicalLocation] = useState(true);
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [propsValues, setPropsValues] = useState<Record<string, string | boolean>>({});
  const [keepProps, setKeepProps] = useState(true);
  const [keepLocation, setKeepLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prefill, setPrefill] = useState<Record<string, string | boolean>>({});
  const [autoAdvance, setAutoAdvance] = useState<Record<string, boolean>>({});
  const [labelPrintEnabled, setLabelPrintEnabled] = useState(false);
  const [printerId, setPrinterId] = useState("");

  const selectedType = itemTypesQuery.data?.find((item) => item.id === typeId);
  const labelTemplateId = selectedType?.label_template_id ?? "";
  const schemaFields = useMemo(() => {
    if (!selectedType) return [];
    const schema = selectedType.schema as Record<string, unknown> | undefined;
    const fields = (schema?.fields as Record<string, Record<string, unknown>>) || {};
    return Object.entries(fields)
      .map(([key, config]) => ({
        key,
        config
      }))
      .sort((a, b) => {
        const aOrder = Number(a.config.order ?? 0);
        const bOrder = Number(b.config.order ?? 0);
        return aOrder - bOrder;
      });
  }, [selectedType]);

  const templateQuery = useQuery({
    queryKey: ["label-template", labelTemplateId],
    queryFn: () => getLabelTemplate(labelTemplateId),
    enabled: !!labelTemplateId && featureFlags.labelPrinting
  });

  const printersQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => listPrinters(),
    enabled: labelPrintEnabled && featureFlags.labelPrinting
  });

  const fieldOrder = useMemo(() => {
    const list = schemaFields.map((field) => field.key);
    if (hasPhysicalLocation) list.unshift("location_id");
    list.unshift("type_id");
    list.push("status", "description");
    return list;
  }, [schemaFields, hasPhysicalLocation]);


  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  useEffect(() => {
    setPropsValues({});
    setAutoAdvance({});
    setPrefill({});
    setLabelPrintEnabled(false);
    setPrinterId("");
  }, [typeId]);

  useEffect(() => {
    if (!locationId && rootLocationId && hasPhysicalLocation) {
      setLocationId(rootLocationId);
    }
  }, [hasPhysicalLocation, locationId, rootLocationId]);

  const defaultAutoAdvance = (key: string) => {
    if (key === "status" || key === "description") return false;
    return true;
  };

  const isAutoAdvance = (key: string) => autoAdvance[key] ?? defaultAutoAdvance(key);

  const autoFieldKeys = useMemo(
    () => fieldOrder.filter((key) => key !== "type_id" && isAutoAdvance(key)),
    [fieldOrder, autoAdvance]
  );

  const autoFieldSet = useMemo(() => new Set(autoFieldKeys), [autoFieldKeys]);

  const updateProp = (key: string, value: string | boolean) => {
    setPropsValues((current) => ({ ...current, [key]: value }));
  };

  const parseValue = (raw: string | boolean, type: string) => {
    if (type === "boolean") {
      if (raw === "") return undefined;
      return Boolean(raw);
    }
    if (type === "integer") {
      if (raw === "") return undefined;
      const parsed = parseInt(String(raw), 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (type === "number") {
      if (raw === "") return undefined;
      const parsed = parseFloat(String(raw));
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return raw === "" ? undefined : raw;
  };

  const buildPropsPayload = () => {
    const payload: Record<string, unknown> = {};
    schemaFields.forEach(({ key, config }) => {
      const type = String(config.type ?? "string");
      const raw = propsValues[key] ?? prefill[key] ?? "";
      const parsed = parseValue(raw, type);
      if (parsed !== undefined) {
        payload[key] = parsed;
      }
    });
    return payload;
  };

  const requiredTemplateVars = useMemo(() => {
    const variables = templateQuery.data?.variables ?? [];
    if (!Array.isArray(variables)) return [];
    return variables
      .filter((variable) => variable && typeof variable.name === "string" && variable.mode === "required")
      .map((variable) => variable.name);
  }, [templateQuery.data]);

  const focusField = (key: string) => {
    const ref = inputRefs.current[key];
    if (ref && "focus" in ref) {
      ref.focus();
      if ("select" in ref) {
        ref.select();
      }
    }
  };

  const focusNext = (currentKey: string) => {
    const currentIndex = fieldOrder.indexOf(currentKey);
    for (let idx = currentIndex + 1; idx < fieldOrder.length; idx += 1) {
      const nextKey = fieldOrder[idx];
      if (autoFieldSet.has(nextKey)) {
        focusField(nextKey);
        return;
      }
    }
    if (autoFieldSet.has(currentKey)) {
      void handleSubmit();
    }
  };

  const focusFirstAuto = () => {
    const firstKey = autoFieldKeys[0];
    if (firstKey) {
      focusField(firstKey);
    } else {
      focusField("type_id");
    }
  };

  const onFieldEnter = (key: string) => (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      focusNext(key);
    }
  };

  const onPrefillFocus = (key: string) => () => {
    const ref = inputRefs.current[key];
    if (ref && "select" in ref) {
      ref.select();
    }
  };

  const handleSubmit = async () => {
    const effectiveLocation = (locationId || String(prefill.location_id ?? "")).trim();
    const effectiveStatus = (status || String(prefill.status ?? "")).trim();
    const effectiveDescription = (description || String(prefill.description ?? "")).trim();
    const propsPayload = buildPropsPayload();

    if (!typeId.trim()) {
      error("Missing type", "Select an item type.");
      return;
    }
    if (hasPhysicalLocation && !effectiveLocation) {
      error("Missing location", "Location ID is required for stored items.");
      return;
    }
    if (labelPrintEnabled) {
      if (!labelTemplateId) {
        error("Missing template", "This item type has no label template assigned.");
        return;
      }
      if (templateQuery.isError) {
        error("Template unavailable", parseErrorMessage(templateQuery.error));
        return;
      }
      if (!printerId.trim()) {
        error("Missing printer", "Select a printer to print a label.");
        return;
      }
      if (requiredTemplateVars.length > 0) {
        const missing = requiredTemplateVars.filter((key) => propsPayload[key] === undefined || propsPayload[key] === "");
        if (missing.length > 0) {
          error("Missing label fields", `Missing required label fields: ${missing.join(", ")}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await createItem({
        location_id: hasPhysicalLocation ? effectiveLocation : null,
        status: effectiveStatus || null,
        description: effectiveDescription || null,
        type_id: typeId,
        props: propsPayload,
        label_print: labelPrintEnabled ? { printer_id: printerId.trim() } : null
      });
      success("Item created", typeId);

      const nextPrefill: Record<string, string | boolean> = {
        location_id: effectiveLocation,
        status: effectiveStatus,
        description: effectiveDescription
      };
      schemaFields.forEach(({ key }) => {
        if (propsValues[key] !== undefined) {
          nextPrefill[key] = propsValues[key];
        } else if (prefill[key] !== undefined) {
          nextPrefill[key] = prefill[key];
        }
      });
      setPrefill(nextPrefill);

      if (!keepLocation) {
        setLocationId("");
        delete nextPrefill.location_id;
      }
      if (!keepProps) {
        setPropsValues({});
        setPrefill({
          location_id: nextPrefill.location_id ?? "",
          status: nextPrefill.status ?? "",
          description: nextPrefill.description ?? ""
        });
      } else {
        setPropsValues({});
      }

      focusFirstAuto();
    } catch (err) {
      error("Create failed", parseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!featureFlags.createItems) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Create items is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header">
            <h2>Create Items</h2>
            <div className="muted">Scanner-first entry: Enter jumps to the next flagged field, last Enter creates.</div>
          </div>
          <div className="form-stack">
            <Select
              id="create-item-type"
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              onKeyDown={onFieldEnter("type_id")}
              help="Pick the item type; it controls required fields and label template validation."
              ref={(node) => {
                inputRefs.current.type_id = node;
              }}
            >
                <option value="">Select item type</option>
                {(itemTypesQuery.data ?? []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </Select>
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeDeletedTypes}
                onChange={(event) => setIncludeDeletedTypes(event.target.checked)}
              />
              <span>Include deleted types</span>
              <HelpIcon text="Show item types that have been soft-deleted." />
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={hasPhysicalLocation}
                onChange={(event) => setHasPhysicalLocation(event.target.checked)}
              />
              <span>Physically stored</span>
              <HelpIcon text="Toggles whether the item should be stored in a location versus attached/in use." />
            </label>

            {hasPhysicalLocation && (
              <div className="field-inline">
                <Input
                  className={`field-inline__input ${prefill.location_id ? "input--prefill" : ""}`}
                  placeholder="Location ID"
                  value={locationId || String(prefill.location_id ?? "")}
                  onChange={(event) => {
                    setLocationId(event.target.value);
                    setPrefill((current) => ({ ...current, location_id: "" }));
                  }}
                  onFocus={onPrefillFocus("location_id")}
                  onKeyDown={onFieldEnter("location_id")}
                  help="Scan or select the physical storage location for this item."
                  ref={(node) => {
                    inputRefs.current.location_id = node;
                  }}
                />
                <label className="field-inline__checkbox">
                  <input
                    type="checkbox"
                    checked={isAutoAdvance("location_id")}
                    onChange={(event) =>
                      setAutoAdvance((current) => ({ ...current, location_id: event.target.checked }))
                    }
                  />
                  Auto
                  <HelpIcon text="Controls whether Enter jumps to this field during rapid entry." />
                </label>
              </div>
            )}

            <div className="field-inline">
              <Input
                className={`field-inline__input ${prefill.status ? "input--prefill" : ""}`}
                placeholder="Status (optional)"
                value={status || String(prefill.status ?? "")}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPrefill((current) => ({ ...current, status: "" }));
                }}
                onFocus={onPrefillFocus("status")}
                onKeyDown={onFieldEnter("status")}
                help="Optional status label used for filtering or quick state notes."
                ref={(node) => {
                  inputRefs.current.status = node;
                }}
              />
              <label className="field-inline__checkbox">
                <input
                  type="checkbox"
                  checked={isAutoAdvance("status")}
                  onChange={(event) => setAutoAdvance((current) => ({ ...current, status: event.target.checked }))}
                />
                Auto
                <HelpIcon text="Controls whether Enter jumps to this field during rapid entry." />
              </label>
            </div>

            <div className="field-inline">
              <Input
                className={`field-inline__input ${prefill.description ? "input--prefill" : ""}`}
                placeholder="Description (optional)"
                value={description || String(prefill.description ?? "")}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setPrefill((current) => ({ ...current, description: "" }));
                }}
                onFocus={onPrefillFocus("description")}
                onKeyDown={onFieldEnter("description")}
                help="Optional description shown on the item detail view."
                ref={(node) => {
                  inputRefs.current.description = node;
                }}
              />
              <label className="field-inline__checkbox">
                <input
                  type="checkbox"
                  checked={isAutoAdvance("description")}
                  onChange={(event) =>
                    setAutoAdvance((current) => ({ ...current, description: event.target.checked }))
                  }
                />
                Auto
                <HelpIcon text="Controls whether Enter jumps to this field during rapid entry." />
              </label>
            </div>

            <div className="toggle-row">
              <label className="toggle">
                <input type="checkbox" checked={keepLocation} onChange={(event) => setKeepLocation(event.target.checked)} />
                <span>Keep location</span>
                <HelpIcon text="Keeps the same storage location prefilled for the next item." />
              </label>
              <label className="toggle">
                <input type="checkbox" checked={keepProps} onChange={(event) => setKeepProps(event.target.checked)} />
                <span>Keep props</span>
                <HelpIcon text="Keeps the last entered property values for faster repeated entry." />
              </label>
            </div>
            {featureFlags.labelPrinting && (
              <div className="form-stack">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={labelPrintEnabled}
                    onChange={(event) => setLabelPrintEnabled(event.target.checked)}
                  />
                  <span>Print label</span>
                  <HelpIcon text="Requests a label print immediately after the item is created." />
                </label>
                {labelPrintEnabled && (
                  <>
                    <Select
                      value={printerId}
                      onChange={(event) => setPrinterId(event.target.value)}
                      help="Select the printer that will receive this one-time label print job."
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
                    {labelTemplateId && requiredTemplateVars.length > 0 && (
                      <div className="muted">Required label fields: {requiredTemplateVars.join(", ")}</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Type Properties</h3>
          </div>
          {itemTypesQuery.isLoading && <div className="empty">Loading types...</div>}
          {schemaFields.length === 0 && !itemTypesQuery.isLoading && (
            <div className="empty">Select an item type to see fields.</div>
          )}
          <div className="props-form">
            {schemaFields.map(({ key, config }) => {
              const type = String(config.type ?? "string");
              const label = String(config.label ?? key);
              const required = Boolean(config.required);
              const unit = typeof config.unit === "string" ? config.unit : "";
              const options = Array.isArray(config.enum) ? (config.enum as string[]) : [];
              const value = propsValues[key] ?? "";
              const prefillValue = prefill[key] ?? "";

              if (type === "boolean") {
                return (
                  <label key={key} className="checkbox checkbox--block">
                    <input
                      type="checkbox"
                      checked={Boolean(value || prefillValue)}
                      onChange={(event) => updateProp(key, event.target.checked)}
                    />
                    <span>
                      {label}
                      {required && " *"}
                    </span>
                    <HelpIcon text="Turns this property on or off for the item." />
                  </label>
                );
              }

              if (options.length > 0) {
                return (
                  <div key={key} className="field-inline">
                    <label className="field-inline__label">
                      <span className="field__label">
                        {label}
                        {required && " *"}
                      </span>
                      <Select
                        className={prefillValue && !value ? "select--prefill" : ""}
                        value={String(value || prefillValue)}
                        onChange={(event) => {
                          updateProp(key, event.target.value);
                          setPrefill((current) => ({ ...current, [key]: "" }));
                        }}
                        onKeyDown={onFieldEnter(key)}
                        help="Pick a value from the allowed options for this field."
                        ref={(node) => {
                          inputRefs.current[key] = node;
                        }}
                      >
                        <option value="">Select</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <label className="field-inline__checkbox">
                      <input
                        type="checkbox"
                        checked={isAutoAdvance(key)}
                        onChange={(event) =>
                          setAutoAdvance((current) => ({ ...current, [key]: event.target.checked }))
                        }
                      />
                      Auto
                      <HelpIcon text="Include this field in Enter key auto-advance." />
                    </label>
                  </div>
                );
              }

              const inputType =
                type === "integer" || type === "number"
                  ? "number"
                  : type === "date"
                    ? "date"
                    : type === "date-time"
                      ? "datetime-local"
                      : "text";

              return (
                <div key={key} className="field-inline">
                  <label className="field-inline__label">
                    <span className="field__label">
                      {label}
                      {required && " *"}
                      {unit && <span className="field__unit">{unit}</span>}
                    </span>
              <Input
                type={inputType}
                className={prefillValue && !value ? "input--prefill" : ""}
                value={String(value || prefillValue)}
                onChange={(event) => {
                  updateProp(key, event.target.value);
                  setPrefill((current) => ({ ...current, [key]: "" }));
                }}
                onKeyDown={onFieldEnter(key)}
                onFocus={onPrefillFocus(key)}
                help="Enter the value to store for this property."
                ref={(node) => {
                  inputRefs.current[key] = node;
                }}
              />
            </label>
            <label className="field-inline__checkbox">
              <input
                type="checkbox"
                checked={isAutoAdvance(key)}
                onChange={(event) =>
                  setAutoAdvance((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              Auto
              <HelpIcon text="Controls whether Enter jumps to this field during rapid entry." />
            </label>
          </div>
        );
      })}
          </div>
        </Card>
      </div>

      <div className="actions">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Create Item"}
        </Button>
      </div>
    </div>
  );
};

export default CreateItemsPage;
