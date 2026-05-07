import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createItem } from "@/api/items";
import { listItemTypes } from "@/api/itemTypes";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";

const IntakePage = () => {
  const toasts = useToasts();
  const { defaults } = getRuntimeConfig();
  const itemTypes = useQuery({ queryKey: ["item-types"], queryFn: () => listItemTypes({ limit: 100 }) });
  const [typeId, setTypeId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [propsJson, setPropsJson] = useState("{}");
  const [printLabel, setPrintLabel] = useState(true);
  const selectedType = useMemo(() => itemTypes.data?.find((type) => type.id === typeId), [itemTypes.data, typeId]);

  const mutation = useMutation({
    mutationFn: () =>
      createItem({
        type_id: typeId,
        location_id: locationId || null,
        status,
        description,
        props: JSON.parse(propsJson) as Record<string, unknown>,
        label_print: printLabel
          ? {
              printer_id: defaults.defaultPrinterId || "Zebra-01",
              return_preview: false
            }
          : null
      }),
    onSuccess: (item) => {
      toasts.success("Item angelegt", item.description || item.id);
      setDescription("");
      setPropsJson("{}");
    },
    onError: (error) => toasts.error("Item konnte nicht angelegt werden", parseErrorMessage(error))
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Eingang</p>
          <h1>Neues Item erfassen</h1>
        </div>
      </div>

      <section className="panel">
        <div className="form-grid form-grid--wide">
          <label className="field">
            <span className="field__label">Item-Typ</span>
            <select className="select" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
              <option value="">Typ auswählen</option>
              {itemTypes.data?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Startort</span>
            <input className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)} placeholder="Ort scannen oder ID einfügen" />
          </label>
          <label className="field">
            <span className="field__label">Beschreibung</span>
            <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="USB-C Kabel 2m schwarz" />
          </label>
          <label className="field">
            <span className="field__label">Status</span>
            <input className="input" value={status} onChange={(event) => setStatus(event.target.value)} />
          </label>
        </div>

        {selectedType && (
          <div className="schema-preview">
            <strong>Schema für {selectedType.name}</strong>
            <pre>{JSON.stringify(selectedType.schema, null, 2)}</pre>
          </div>
        )}

        <label className="field">
          <span className="field__label">Eigenschaften als JSON</span>
          <textarea className="textarea textarea--mono" value={propsJson} onChange={(event) => setPropsJson(event.target.value)} />
        </label>
        <label className="switch-row">
          <input type="checkbox" checked={printLabel} onChange={() => setPrintLabel((current) => !current)} />
          Label direkt drucken
        </label>
        <button className="button button--primary button--lg" type="button" onClick={() => mutation.mutate()} disabled={!typeId || !description}>
          Item anlegen
        </button>
      </section>
    </div>
  );
};

export default IntakePage;
