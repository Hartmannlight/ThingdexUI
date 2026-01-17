import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { Textarea } from "@/components/Textarea";
import { deleteItemType, listItemTypes, updateItemType } from "@/api/itemTypes";
import { listLabelTemplates } from "@/api/labels";
import { getRuntimeConfig } from "@/config/runtime";
import { parseErrorMessage } from "@/api/errors";

const ItemTypesPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const itemTypesQuery = useQuery({
    queryKey: ["item-types", includeDeleted],
    queryFn: () => listItemTypes({ include_deleted: includeDeleted }),
    enabled: featureFlags.itemTypes
  });

  const templatesQuery = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => listLabelTemplates(),
    enabled: featureFlags.labelPrinting
  });

  const [selectedId, setSelectedId] = useState("");
  const [editName, setEditName] = useState("");
  const [editTemplateId, setEditTemplateId] = useState("");
  const [schemaText, setSchemaText] = useState("");
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editStatus, setEditStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(
    null
  );

  const selectedType = useMemo(() => {
    return itemTypesQuery.data?.find((type) => type.id === selectedId) ?? null;
  }, [itemTypesQuery.data, selectedId]);

  useEffect(() => {
    if (selectedType) {
      setEditName(selectedType.name);
      setEditTemplateId(selectedType.label_template_id ?? "");
      setSchemaText(JSON.stringify(selectedType.schema ?? {}, null, 2));
      setSchemaError(null);
      setEditStatus(null);
    }
  }, [selectedType]);

  const parseSchema = () => {
    if (!schemaText.trim()) return null;
    try {
      const parsed = JSON.parse(schemaText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setSchemaError("Schema must be a JSON object.");
        return null;
      }
      setSchemaError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setSchemaError("Invalid JSON.");
      return null;
    }
  };

  const submitUpdate = async () => {
    if (!selectedId) {
      setEditStatus({ kind: "warning", title: "Select a type", message: "Choose an item type to edit." });
      return;
    }
    if (!editName.trim()) {
      setEditStatus({ kind: "warning", title: "Missing name", message: "Name is required." });
      return;
    }
    const schema = parseSchema();
    if (schemaText.trim() && !schema) {
      return;
    }
    setUpdating(true);
    setEditStatus(null);
    try {
      await updateItemType(selectedId, {
        name: editName.trim(),
        schema: schema ?? undefined,
        label_template_id: editTemplateId.trim() || null
      });
      setEditStatus({ kind: "success", title: "Updated", message: "Item type saved." });
      itemTypesQuery.refetch();
    } catch (err) {
      setEditStatus({ kind: "error", title: "Update failed", message: parseErrorMessage(err) });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setEditStatus({ kind: "warning", title: "Select a type", message: "Choose an item type to delete." });
      return;
    }
    const confirmed = window.confirm("Delete this item type? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setDeleting(true);
    setEditStatus(null);
    try {
      await deleteItemType(selectedId);
      setEditStatus({ kind: "success", title: "Deleted", message: "Item type deleted." });
      setSelectedId("");
      setEditName("");
      setEditTemplateId("");
      setSchemaText("");
      itemTypesQuery.refetch();
    } catch (err) {
      setEditStatus({ kind: "error", title: "Delete failed", message: parseErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  if (!featureFlags.itemTypes) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Item type management is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card>
          <div className="card__header">
            <h3>Item Type Editor</h3>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
            />
            <span>Include deleted</span>
          </label>
          <div className="muted">Select a type to edit its schema and label template.</div>
          {itemTypesQuery.isLoading && <div className="empty">Loading types...</div>}
          {itemTypesQuery.isError && (
            <StatusBanner kind="error" title="Types failed" message={parseErrorMessage(itemTypesQuery.error)} />
          )}
          {itemTypesQuery.data?.length === 0 && <div className="empty">No item types yet.</div>}
          {itemTypesQuery.data && itemTypesQuery.data.length > 0 && (
            <div className="list">
              {itemTypesQuery.data.map((type) => {
                const schema = type.schema as Record<string, unknown>;
                const fields =
                  typeof schema?.fields === "object" && schema.fields
                    ? (schema.fields as Record<string, unknown>)
                    : {};
                const fieldCount = Object.keys(fields).length;

                return (
                  <div key={type.id} className="list__row">
                    <div>
                      <div className="list__title">{type.name}</div>
                      <div className="muted">{type.id}</div>
                    </div>
                    <div className="pill">{fieldCount} fields</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="card__header">
            <h3>Edit Item Type</h3>
          </div>
          {editStatus && <StatusBanner kind={editStatus.kind} title={editStatus.title} message={editStatus.message} />}
          <div className="form-stack">
            <Select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              help="Choose the item type to edit; its settings will load below."
            >
              <option value="">Select item type</option>
              {itemTypesQuery.data?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              help="Update the display name shown across lists, forms, and search."
            />
            {featureFlags.labelPrinting && (
              <Select
                value={editTemplateId}
                onChange={(event) => setEditTemplateId(event.target.value)}
                help="Select the label template used when printing items of this type."
              >
                <option value="">Label template (optional)</option>
                {templatesQuery.data?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.id} {template.name ? `- ${template.name}` : ""}
                  </option>
                ))}
              </Select>
            )}
            <Textarea
              mono
              value={schemaText}
              onChange={(event) => {
                setSchemaText(event.target.value);
                setSchemaError(null);
              }}
              placeholder="Schema JSON"
              help="Paste the full schema JSON; it defines fields and validation rules."
            />
            {schemaError && <StatusBanner kind="error" title="Schema error" message={schemaError} />}
            {templatesQuery.isError && (
              <StatusBanner kind="error" title="Templates failed" message={parseErrorMessage(templatesQuery.error)} />
            )}
            <div className="builder__actions">
              <Button size="lg" onClick={submitUpdate} disabled={updating || deleting}>
                {updating ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="danger" size="lg" onClick={handleDelete} disabled={updating || deleting || !selectedId}>
                {deleting ? "Deleting..." : "Delete Type"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ItemTypesPage;
