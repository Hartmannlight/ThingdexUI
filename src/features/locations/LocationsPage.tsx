import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { createLocation, getLocation, getPath, listChildren } from "@/api/locations";
import { listPrinters } from "@/api/printers";
import { getLabelTemplate, isValidLocationTemplate, listLabelTemplates } from "@/api/labels";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";
import { getRuntimeConfig } from "@/config/runtime";
import { HelpIcon } from "@/components/HelpIcon";

const LocationsPage = () => {
  const { success: toastSuccess, error: toastError } = useToasts();
  const { featureFlags } = getRuntimeConfig();
  const rootLocationId = useBootstrapRootLocation();
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [labelPrintEnabled, setLabelPrintEnabled] = useState(false);
  const [printerId, setPrinterId] = useState("");
  const [labelTemplateId, setLabelTemplateId] = useState("");
  const [filterValidTemplates, setFilterValidTemplates] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  useEffect(() => {
    if (rootLocationId && !parentId) {
      setParentId(rootLocationId);
    }
  }, [rootLocationId, parentId]);

  const childrenQuery = useQuery({
    queryKey: ["location", parentId, "children", includeDeleted],
    queryFn: () => listChildren(parentId, { include_deleted: includeDeleted }),
    enabled: !!parentId
  });

  const currentLocationQuery = useQuery({
    queryKey: ["location", parentId],
    queryFn: () => getLocation(parentId),
    enabled: !!parentId
  });

  const pathQuery = useQuery({
    queryKey: ["location", parentId, "path"],
    queryFn: () => getPath(parentId),
    enabled: !!parentId
  });

  const printersQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => listPrinters(),
    enabled: featureFlags.labelPrinting && labelPrintEnabled
  });

  const templatesQuery = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => listLabelTemplates(),
    enabled: featureFlags.labelPrinting
  });

  const templateIds = useMemo(() => (templatesQuery.data ?? []).map((template) => template.id), [templatesQuery.data]);

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
    enabled: featureFlags.labelPrinting && filterValidTemplates && templateIds.length > 0
  });

  const templateDetailQuery = useQuery({
    queryKey: ["label-template", labelTemplateId],
    queryFn: () => getLabelTemplate(labelTemplateId),
    enabled: featureFlags.labelPrinting && !!labelTemplateId
  });

  const templateVariables = templateDetailQuery.data?.variables ?? [];
  const invalidVariableNames = useMemo(
    () =>
      templateVariables
        .map((variable) => variable?.name)
        .filter((name): name is string => typeof name === "string" && name.includes("-")),
    [templateVariables]
  );
  const requiredVariables = useMemo(
    () =>
      templateVariables
        .filter((variable) => variable?.mode === "required")
        .map((variable) => variable?.name)
        .filter((name): name is string => typeof name === "string"),
    [templateVariables]
  );
  const missingRequiredVariables = useMemo(() => {
    const required = new Set(requiredVariables);
    return ["location_uuid", "container_name"].filter((name) => !required.has(name));
  }, [requiredVariables]);
  const hasTemplateIssues = !isValidLocationTemplate(templateDetailQuery.data);

  const validTemplateIds = useMemo(() => {
    const entries = templateValidityQuery.data ?? [];
    return new Set(entries.filter((entry) => isValidLocationTemplate(entry.detail)).map((entry) => entry.id));
  }, [templateValidityQuery.data]);

  const templateOptions = useMemo(() => {
    const templates = templatesQuery.data ?? [];
    if (!filterValidTemplates) return templates;
    return templates.filter((template) => validTemplateIds.has(template.id));
  }, [templatesQuery.data, filterValidTemplates, validTemplateIds]);

  useEffect(() => {
    if (filterValidTemplates && labelTemplateId && templateValidityQuery.data && !validTemplateIds.has(labelTemplateId)) {
      setLabelTemplateId("");
    }
  }, [filterValidTemplates, labelTemplateId, templateValidityQuery.data, validTemplateIds]);

  const create = async () => {
    try {
      if (labelPrintEnabled && !labelTemplateId.trim()) {
        toastError("Missing template", "Select a label template for this location.");
        return;
      }
      if (labelTemplateId.trim() && templateDetailQuery.isLoading) {
        toastError("Template loading", "Wait for the label template to finish loading.");
        return;
      }
      if (labelTemplateId.trim() && templateDetailQuery.isError) {
        toastError("Template not found", "The selected label template could not be loaded.");
        return;
      }
      if (labelTemplateId.trim() && hasTemplateIssues) {
        toastError(
          "Template invalid",
          "Label templates for locations must use location_uuid and container_name and cannot include '-' in variables."
        );
        return;
      }
      if (labelPrintEnabled && !printerId.trim()) {
        toastError("Missing printer", "Select a printer to print the container label.");
        return;
      }
      const response = await createLocation({
        name: name.trim(),
        parent_id: parentId || null,
        meta: labelTemplateId.trim() ? { label_template_id: labelTemplateId.trim() } : null,
        label_print: labelPrintEnabled
          ? {
              printer_id: printerId.trim(),
              template_id: labelTemplateId.trim() || null
            }
          : null
      });
      toastSuccess("Location created", response.name);
      setName("");
      setLabelPrintEnabled(false);
      setPrinterId("");
      setLabelTemplateId("");
      childrenQuery.refetch();
    } catch (error) {
      toastError("Create failed", parseErrorMessage(error));
    }
  };

  const currentPath = pathQuery.data ?? [];
  const currentName = currentPath.length > 0 ? currentPath[currentPath.length - 1].name : "";
  const canCreate =
    name.trim().length > 0 &&
    !!parentId &&
    !(labelTemplateId.trim() && filterValidTemplates && templateValidityQuery.isLoading) &&
    !(labelTemplateId.trim() && templateDetailQuery.isLoading) &&
    !(labelTemplateId.trim() && templateDetailQuery.isError) &&
    !(labelTemplateId.trim() && hasTemplateIssues);
  const currentLocation = currentLocationQuery.data;

  return (
    <div className="page">
      {!rootLocationId && (
        <StatusBanner kind="info" title="Bootstrapping root location" message="Fetching root location..." />
      )}

      <div className="locations-grid">
        <Card>
          <div className="card__header">
            <h3>Create Location</h3>
          </div>
          <div className="form-stack">
            {currentName && <div className="muted">Parent: {currentName}</div>}
            <Input
              className="input--lg"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              help="Enter the name that will appear in navigation and breadcrumbs."
            />
            {featureFlags.labelPrinting && (
              <>
                <Select
                  value={labelTemplateId}
                  onChange={(event) => setLabelTemplateId(event.target.value)}
                  help="Pick the label template stored on this location for future reprints."
                  disabled={filterValidTemplates && templateValidityQuery.isLoading}
                >
                  <option value="">Label template (optional)</option>
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
                {filterValidTemplates && templateValidityQuery.isLoading && (
                  <StatusBanner kind="info" title="Checking templates" message="Validating label templates..." />
                )}
                {templateDetailQuery.isError && (
                  <StatusBanner kind="error" title="Template not found" message="Selected template could not be loaded." />
                )}
                {labelTemplateId.trim() && !templateDetailQuery.isLoading && !templateDetailQuery.isError && hasTemplateIssues && (
                  <StatusBanner
                    kind="warning"
                    title="Template variables invalid"
                    message={[
                      missingRequiredVariables.length > 0
                        ? `Missing required variables: ${missingRequiredVariables.join(", ")}.`
                        : null,
                      invalidVariableNames.length > 0
                        ? `Invalid variable names: ${invalidVariableNames.join(", ")}.`
                        : null,
                      "Location templates must use location_uuid and container_name (no '-' in names)."
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
                {templatesQuery.isError && (
                  <StatusBanner kind="error" title="Templates failed" message={parseErrorMessage(templatesQuery.error)} />
                )}
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={labelPrintEnabled}
                    onChange={(event) => setLabelPrintEnabled(event.target.checked)}
                  />
                  <span>Print label</span>
                  <HelpIcon text="Enable this to send a label print job right after the location is created." />
                </label>
                {labelPrintEnabled && (
                  <>
                    <Select
                      value={printerId}
                      onChange={(event) => setPrinterId(event.target.value)}
                      help="Choose the printer for this one-time label print during creation."
                    >
                      <option value="">Select printer</option>
                      {printersQuery.data?.map((printer) => (
                        <option key={printer.id} value={printer.id}>
                          {printer.name ?? printer.id}
                        </option>
                      ))}
                    </Select>
                    {printersQuery.isError && (
                      <StatusBanner kind="error" title="Printers failed" message={parseErrorMessage(printersQuery.error)} />
                    )}
                  </>
                )}
              </>
            )}
            <Button size="lg" onClick={create} disabled={!canCreate}>
              Create
            </Button>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Children</h3>
          </div>
          {parentId && <div className="muted">Current location ID: {parentId}</div>}
          {currentLocation?.name && <div className="muted">Name: {currentLocation.name}</div>}
          <label className="toggle">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
            />
            <span>Include deleted</span>
          </label>
          {pathQuery.data && (
            <div className="breadcrumbs breadcrumbs--inline">
              {pathQuery.data.map((node, index) => (
                <span key={node.id} className="breadcrumbs__item">
                  <button type="button" className="breadcrumbs__button" onClick={() => setParentId(node.id)}>
                    {node.name}
                  </button>
                  {index < pathQuery.data.length - 1 && <span className="breadcrumbs__sep">/</span>}
                </span>
              ))}
            </div>
          )}
          {childrenQuery.isLoading && <div className="empty">Loading children...</div>}
          {childrenQuery.isError && (
            <StatusBanner kind="error" title="Children failed" message={parseErrorMessage(childrenQuery.error)} />
          )}
          {childrenQuery.data?.length === 0 && <div className="empty">No child locations.</div>}
          {childrenQuery.data && childrenQuery.data.length > 0 && (
            <div className="list">
              {childrenQuery.data.map((child) => (
                <button key={child.id} className="list__row" onClick={() => setParentId(child.id)} type="button">
                  <span>{child.name}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default LocationsPage;
