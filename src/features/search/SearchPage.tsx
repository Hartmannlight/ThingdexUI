import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { HelpIcon } from "@/components/HelpIcon";
import { getLocation, getPath } from "@/api/locations";
import { getItem, searchItems } from "@/api/items";
import { listItemTypes } from "@/api/itemTypes";
import { ApiError, parseErrorMessage } from "@/api/errors";
import type { ItemDetailOut, LocationOut, LocationPathItem } from "@/api/types";
import { getRuntimeConfig } from "@/config/runtime";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const ops = ["==", "!=", ">", ">=", "<", "<=", "contains", "in"] as const;

type FilterRow = {
  path: string;
  op: (typeof ops)[number];
  value: string;
};

type LookupResult =
  | { kind: "item"; item: ItemDetailOut }
  | { kind: "location"; location: LocationOut; path: LocationPathItem[] };

const parseFilterValue = (raw: string, op: FilterRow["op"]) => {
  const trimmed = raw.trim();
  if (op === "in") {
    return trimmed
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && trimmed.match(/^-?\d+(\.\d+)?$/)) return numeric;
  return trimmed;
};

const SearchPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const rootLocationId = useBootstrapRootLocation();
  const [type, setType] = useState("");
  const [locationId, setLocationId] = useState(rootLocationId ?? "");
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [inUse, setInUse] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([{ path: "", op: "==", value: "" }]);
  const [results, setResults] = useState<Array<{ id: string; status?: string | null; type_id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupStatus, setLookupStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const lookupRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (rootLocationId) {
      setLocationId(rootLocationId);
    }
  }, [rootLocationId]);

  const itemTypesQuery = useQuery({
    queryKey: ["item-types"],
    queryFn: () => listItemTypes(),
    enabled: featureFlags.search
  });

  const rootLocationQuery = useQuery({
    queryKey: ["location", rootLocationId],
    queryFn: () => getLocation(rootLocationId ?? ""),
    enabled: !!rootLocationId
  });

  const typeNameMap = useMemo(() => {
    return new Map((itemTypesQuery.data ?? []).map((itemType) => [itemType.id, itemType.name]));
  }, [itemTypesQuery.data]);

  const selectedType = itemTypesQuery.data?.find((itemType) => itemType.name === type);
  const typeFields = useMemo(() => {
    if (!selectedType) return [];
    const schema = selectedType.schema as Record<string, unknown> | undefined;
    const fields = (schema?.fields as Record<string, Record<string, unknown>>) || {};
    return Object.keys(fields);
  }, [selectedType]);

  const typeFieldConfigs = useMemo(() => {
    if (!selectedType) return {};
    const schema = selectedType.schema as Record<string, unknown> | undefined;
    const fields = (schema?.fields as Record<string, Record<string, unknown>>) || {};
    return fields;
  }, [selectedType]);

  const updateFilter = (index: number, updates: Partial<FilterRow>) => {
    setFilters((current) => current.map((row, idx) => (idx === index ? { ...row, ...updates } : row)));
  };

  const addFilter = () => setFilters((current) => [...current, { path: "", op: "==", value: "" }]);
  const removeFilter = (index: number) => setFilters((current) => current.filter((_, idx) => idx !== index));

  const runSearch = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const payloadFilters = filters
        .filter((row) => row.path.trim())
        .map((row) => ({
          path: row.path.trim(),
          op: row.op,
          value: parseFilterValue(row.value, row.op)
        }));

      const payload = {
        type: type.trim() || null,
        location: locationId.trim()
          ? {
              root_location_id: locationId.trim(),
              include_descendants: includeDescendants
            }
          : null,
        props_filters: payloadFilters.length > 0 ? payloadFilters : null,
        in_use: inUse === "" ? null : inUse === "true"
      };

      const response = await searchItems(payload);
      setResults(response.map((item) => ({ id: item.id, status: item.status, type_id: item.type_id })));
      setStatus({ kind: "success", title: "Search complete", message: `${response.length} items` });
    } catch (err) {
      setStatus({ kind: "error", title: "Search failed", message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const resolveLookup = async () => {
    const id = lookupId.trim();
    if (!id) return;
    setLookupStatus({ kind: "info", title: "Looking up", message: "Checking item and location records..." });
    setLookupResult(null);

    try {
      const item = await getItem(id);
      setLookupResult({ kind: "item", item });
      setLookupStatus({ kind: "success", title: "Item found", message: item.type?.name ?? item.type_id });
      lookupRef.current?.select();
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        setLookupStatus({ kind: "error", title: "Lookup failed", message: parseErrorMessage(error) });
        return;
      }
    }

    try {
      const location = await getLocation(id);
      const path = await getPath(id);
      setLookupResult({ kind: "location", location, path });
      setLookupStatus({ kind: "success", title: "Location found", message: location.name });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setLookupStatus({ kind: "warning", title: "Not found", message: "No item or location with that ID." });
      } else {
        setLookupStatus({ kind: "error", title: "Lookup failed", message: parseErrorMessage(error) });
      }
    } finally {
      lookupRef.current?.select();
    }
  };

  const onLookupEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void resolveLookup();
    }
  };

  if (!featureFlags.search) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Search is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card>
          <div className="card__header">
            <h3>Lookup by ID</h3>
          </div>
          <div className="form-stack">
            <Input
              placeholder="Scan or paste an item/location ID"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              onKeyDown={onLookupEnter}
              ref={lookupRef}
              help="Scan any UUID; the system checks item then location and shows the matching record."
            />
            <Button size="lg" onClick={resolveLookup}>
              Resolve ID
            </Button>
            {lookupStatus && <StatusBanner kind={lookupStatus.kind} title={lookupStatus.title} message={lookupStatus.message} />}
            {lookupResult?.kind === "item" && (
              <div className="detail-meta">
                <div className="detail-meta__row">
                  <span className="detail-meta__label">Item type</span>
                  <span>{lookupResult.item.type?.name ?? lookupResult.item.type_id}</span>
                </div>
                <div className="detail-meta__row">
                  <span className="detail-meta__label">Status</span>
                  <span>{lookupResult.item.status ?? "stored"}</span>
                </div>
                {lookupResult.item.location?.effective_location_path && (
                  <div className="detail-meta__row">
                    <span className="detail-meta__label">Location</span>
                    <span>
                      {lookupResult.item.location.effective_location_path
                        .map((node) => node.name)
                        .join(" / ")}
                    </span>
                  </div>
                )}
                <Link to="/items/$itemId" params={{ itemId: lookupResult.item.id }} className="link-button">
                  Open item detail
                </Link>
              </div>
            )}
            {lookupResult?.kind === "location" && (
              <div className="detail-meta">
                <div className="detail-meta__row">
                  <span className="detail-meta__label">Location</span>
                  <span>{lookupResult.location.name}</span>
                </div>
                {lookupResult.path.length > 0 && (
                  <div className="detail-meta__row">
                    <span className="detail-meta__label">Path</span>
                    <span>{lookupResult.path.map((node) => node.name).join(" / ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h2>Search Inventory</h2>
            <Button variant="outline" size="sm" onClick={addFilter}>
              Add Filter
            </Button>
          </div>
          <div className="form-stack">
            <Select
              value={type}
              onChange={(event) => setType(event.target.value)}
              help="Limit results to one item type to show relevant fields and filters."
            >
              <option value="">Any type</option>
              {itemTypesQuery.data?.map((itemType) => (
                <option key={itemType.id} value={itemType.name}>
                  {itemType.name}
                </option>
              ))}
            </Select>
            <div className="detail-meta">
              <div className="detail-meta__row">
                <span className="detail-meta__label">Root location</span>
                <span>{rootLocationQuery.data?.name ?? "Loading root location..."}</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeDescendants}
                onChange={(event) => setIncludeDescendants(event.target.checked)}
              />
              <span>Include descendants</span>
              <HelpIcon text="Also include items stored in nested child locations under the chosen root." />
            </label>
            <Select
              value={inUse}
              onChange={(event) => setInUse(event.target.value)}
              help="Filter by whether items are currently in use or stored."
            >
              <option value="">In use or stored</option>
              <option value="true">In use</option>
              <option value="false">Stored</option>
            </Select>

            <div className="filters">
              {filters.map((row, index) => (
                <div key={`${row.path}-${index}`} className="filters__row">
                  {typeFields.length > 0 ? (
                    <Select
                      value={row.path}
                      onChange={(event) => updateFilter(index, { path: event.target.value })}
                      help="Select the item property to filter on for this row."
                    >
                      <option value="">Select property</option>
                      {typeFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      placeholder="Property path"
                      value={row.path}
                      onChange={(event) => updateFilter(index, { path: event.target.value })}
                      help="Enter the property key to filter on when no type is selected."
                    />
                  )}
                  <Select
                    value={row.op}
                    onChange={(event) => updateFilter(index, { op: event.target.value as FilterRow["op"] })}
                    help="Choose how the value should be compared (equals, contains, range, etc.)."
                  >
                    {ops.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </Select>
                  {Array.isArray(typeFieldConfigs[row.path]?.enum) ? (
                    <Select
                      value={row.value}
                      onChange={(event) => updateFilter(index, { value: event.target.value })}
                      help="Pick one of the allowed values for this property."
                    >
                      <option value="">Select value</option>
                      {(typeFieldConfigs[row.path]?.enum as string[]).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      placeholder="value"
                      value={row.value}
                      onChange={(event) => updateFilter(index, { value: event.target.value })}
                      help="Enter the value to compare against for this filter."
                    />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeFilter(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button size="lg" onClick={runSearch} disabled={loading}>
              {loading ? "Searching..." : "Run Search"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Results</h3>
          </div>
          {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
          {results.length === 0 && !loading && <div className="empty">No results yet.</div>}
          <div className="list">
            {results.map((item) => (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="list__row">
                <div>
                  <div className="list__title">{typeNameMap.get(item.type_id) ?? "Item"}</div>
                  <div className="muted">{typeNameMap.get(item.type_id) ?? "Unknown type"}</div>
                </div>
                <div className="pill">{item.status ?? "stored"}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SearchPage;
