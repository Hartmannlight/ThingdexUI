import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createItemType, listItemTypes, updateItemType } from "@/api/itemTypes";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";

const AdminPage = () => {
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const itemTypes = useQuery({ queryKey: ["item-types"], queryFn: () => listItemTypes({ limit: 100, include_deleted: true }) });
  const [selectedId, setSelectedId] = useState("");
  const selected = itemTypes.data?.find((type) => type.id === selectedId);
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("{}");
  const [ui, setUi] = useState("{}");
  const [templateId, setTemplateId] = useState("");

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        schema: JSON.parse(schema) as Record<string, unknown>,
        ui: JSON.parse(ui) as Record<string, unknown>,
        label_template_id: templateId || null
      };
      return selected ? updateItemType(selected.id, payload) : createItemType(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["item-types"] });
      toasts.success("Item-Typ gespeichert");
    },
    onError: (error) => toasts.error("Item-Typ konnte nicht gespeichert werden", parseErrorMessage(error))
  });

  const loadSelected = (id: string) => {
    const next = itemTypes.data?.find((type) => type.id === id);
    setSelectedId(id);
    setName(next?.name || "");
    setSchema(JSON.stringify(next?.schema || {}, null, 2));
    setUi(JSON.stringify(next?.ui || {}, null, 2));
    setTemplateId(next?.label_template_id || "");
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Verwaltung</p>
          <h1>Item-Typen und Label-Konfiguration</h1>
        </div>
        <button className="button button--outline" type="button" onClick={() => loadSelected("")}>
          Neuer Typ
        </button>
      </div>

      <div className="split-view">
        <section className="panel panel--compact">
          <h2>Item-Typen</h2>
          <div className="touch-list">
            {itemTypes.data?.map((type) => (
              <button className="touch-card" type="button" key={type.id} onClick={() => loadSelected(type.id)}>
                <strong>{type.name}</strong>
                <span>{type.label_template_id || "kein Template"}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Name</span>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Label Template ID</span>
              <input className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value)} />
            </label>
          </div>
          <label className="field">
            <span className="field__label">Schema</span>
            <textarea className="textarea textarea--mono" value={schema} onChange={(event) => setSchema(event.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">UI-Hints</span>
            <textarea className="textarea textarea--mono" value={ui} onChange={(event) => setUi(event.target.value)} />
          </label>
          <button className="button button--primary button--lg" type="button" onClick={() => saveMutation.mutate()} disabled={!name}>
            Speichern
          </button>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
