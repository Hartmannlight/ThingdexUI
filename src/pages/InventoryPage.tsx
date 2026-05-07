import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { searchItems } from "@/api/items";
import { listItemTypes } from "@/api/itemTypes";
import { parseErrorMessage } from "@/api/errors";
import type { ItemTypeOut, SearchRequest } from "@/api/types";
import { ActionTile } from "@/components/actions/ActionTile";
import { ItemStatusBadge } from "@/components/entities/ItemStatusBadge";
import { useToasts } from "@/hooks/useToasts";
import { itemTitle, shortId } from "@/utils/entityLabels";

type FilterRow = {
  path: string;
  op: "in" | "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains";
  value: string;
};

const readSchemaProperties = (itemType?: ItemTypeOut) => {
  const schema = itemType?.schema;
  const properties = schema && typeof schema === "object" && "properties" in schema ? schema.properties : null;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return [];
  return Object.keys(properties as Record<string, unknown>);
};

const InventoryPage = () => {
  const toasts = useToasts();
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [locationId, setLocationId] = useState("");
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const itemTypesQuery = useQuery({ queryKey: ["item-types"], queryFn: () => listItemTypes({ limit: 100 }) });
  const selectedType = itemTypesQuery.data?.find((type) => type.id === selectedTypeId);
  const schemaProperties = useMemo(() => readSchemaProperties(selectedType), [selectedType]);

  const searchMutation = useMutation({
    mutationFn: () => {
      const payload: SearchRequest = {
        type: selectedType?.name || null,
        location: locationId ? { root_location_id: locationId, include_descendants: includeDescendants } : null,
        props_filters: filters
          .filter((filter) => filter.path && filter.op && filter.value)
          .map((filter) => ({
            path: filter.path,
            op: filter.op,
            value: Number.isFinite(Number(filter.value)) && filter.value.trim() !== "" ? Number(filter.value) : filter.value
          })),
        include: ["type", "location", "relation_summary"],
        limit: 100,
        offset: 0
      };
      return searchItems(payload);
    },
    onError: (error) => toasts.error("Suche fehlgeschlagen", parseErrorMessage(error))
  });

  const results = (searchMutation.data || []).filter((item) => {
    const title = itemTitle(item).toLowerCase();
    return (!query || title.includes(query.toLowerCase()) || item.id.includes(query)) && (!status || item.status === status);
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventar</p>
          <h1>Suche und typbasierte Filter</h1>
        </div>
        <button className="button button--primary button--lg" type="button" onClick={() => searchMutation.mutate()}>
          Suchen
        </button>
      </div>

      <div className="split-view split-view--filters">
        <section className="panel panel--compact">
          <h2>Filter</h2>
          <label className="field">
            <span className="field__label">Freitext</span>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Beschreibung oder ID" />
          </label>
          <label className="field">
            <span className="field__label">Typ</span>
            <select
              className="select"
              value={selectedTypeId}
              onChange={(event) => {
                setSelectedTypeId(event.target.value);
                setFilters([]);
              }}
            >
              <option value="">Alle Typen</option>
              {itemTypesQuery.data?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Status</span>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Alle</option>
              <option value="active">aktiv</option>
              <option value="archived">archiviert</option>
              <option value="defect">defekt</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Ort</span>
            <input className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)} placeholder="Ort-ID" />
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={includeDescendants} onChange={() => setIncludeDescendants((current) => !current)} />
            Unterorte einschließen
          </label>

          {selectedType && (
            <section className="form-panel">
              <h2>Dynamische Filter</h2>
              {filters.map((filter, index) => (
                <div className="filter-row" key={`${filter.path}-${index}`}>
                  <select
                    className="select"
                    value={filter.path}
                    onChange={(event) =>
                      setFilters((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, path: event.target.value } : entry)))
                    }
                  >
                    <option value="">Feld</option>
                    {schemaProperties.map((property) => (
                      <option key={property} value={property}>
                        {property}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select"
                    value={filter.op}
                    onChange={(event) =>
                      setFilters((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                op: event.target.value as FilterRow["op"]
                              }
                            : entry
                        )
                      )
                    }
                  >
                    <option value="==">=</option>
                    <option value="contains">enthält</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    className="input"
                    value={filter.value}
                    onChange={(event) =>
                      setFilters((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, value: event.target.value } : entry)))
                    }
                    placeholder="Wert"
                  />
                </div>
              ))}
              <button className="button button--outline" type="button" onClick={() => setFilters((current) => [...current, { path: "", op: "==", value: "" }])}>
                Filter hinzufügen
              </button>
            </section>
          )}
        </section>

        <section className="panel">
          <div className="section-title">
            <span className="section-title__mark">##</span>
            Ergebnisse
          </div>
          {searchMutation.isPending && <div className="inline-loading">Suche läuft ...</div>}
          <div className="result-grid">
            {results.map((item) => (
              <article key={item.id} className="item-result-card">
                <div>
                  <h2>{itemTitle(item)}</h2>
                  <dl className="meta-list">
                    <div>
                      <dt>Typ</dt>
                      <dd>{item.type_id}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <ItemStatusBadge status={item.status} />
                      </dd>
                    </div>
                    <div>
                      <dt>ID</dt>
                      <dd>{shortId(item.id)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="card-actions">
                  <Link className="button button--primary" to="/items/$itemId" params={{ itemId: item.id }}>
                    Öffnen
                  </Link>
                  <button className="button button--outline" type="button">
                    Verschieben
                  </button>
                  <button className="button button--outline" type="button">
                    Label drucken
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!searchMutation.data && (
            <div className="empty-state">
              <ActionTile mark="##" title="Suchfilter setzen" detail="Typ wählen, Filter ergänzen und suchen" />
            </div>
          )}
          {searchMutation.data && results.length === 0 && <div className="empty">Keine Treffer.</div>}
        </section>
      </div>
    </div>
  );
};

export default InventoryPage;
