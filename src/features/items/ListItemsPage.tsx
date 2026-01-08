import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { StatusBanner } from "@/components/StatusBanner";
import { listItems } from "@/api/items";
import { listItemTypes } from "@/api/itemTypes";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";

const ListItemsPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const [typeName, setTypeName] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [inUse, setInUse] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; type_id: string; status?: string | null }>>([]);
  const [pageStatus, setPageStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);

  const typeRef = useRef<HTMLSelectElement | null>(null);
  const statusRef = useRef<HTMLInputElement | null>(null);
  const inUseRef = useRef<HTMLSelectElement | null>(null);

  const itemTypesQuery = useQuery({
    queryKey: ["item-types"],
    queryFn: () => listItemTypes(),
    enabled: featureFlags.inventory
  });

  const typeNameMap = useMemo(() => {
    return new Map((itemTypesQuery.data ?? []).map((type) => [type.id, type.name]));
  }, [itemTypesQuery.data]);

  useEffect(() => {
    typeRef.current?.focus();
  }, []);

  const run = async () => {
    setLoading(true);
    setPageStatus(null);
    try {
      const response = await listItems({
        type: typeName.trim() || null,
        status: statusValue.trim() || null,
        in_use: inUse === "" ? null : inUse === "true"
      });
      setResults(response.map((item) => ({ id: item.id, type_id: item.type_id, status: item.status })));
      setPageStatus({ kind: "success", title: "Items loaded", message: `${response.length} items` });
    } catch (err) {
      setPageStatus({ kind: "error", title: "Load failed", message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const onTypeEnter = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      statusRef.current?.focus();
    }
  };

  const onStatusEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inUseRef.current?.focus();
    }
  };

  const onInUseEnter = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void run();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Inventory listing is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header">
            <h2>List Items</h2>
          </div>
          <div className="form-stack">
            <Select
              value={typeName}
              onChange={(event) => setTypeName(event.target.value)}
              onKeyDown={onTypeEnter}
              help="Limit results to a single item type, or leave blank for all types."
              ref={typeRef}
            >
              <option value="">Any type</option>
              {itemTypesQuery.data?.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Status (optional)"
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value)}
              onKeyDown={onStatusEnter}
              help="Only show items with this status; leave blank to ignore status."
              ref={statusRef}
            />
            <Select
              value={inUse}
              onChange={(event) => setInUse(event.target.value)}
              onKeyDown={onInUseEnter}
              help="Choose whether to show items currently in use or stored."
              ref={inUseRef}
            >
              <option value="">In use or stored</option>
              <option value="true">In use</option>
              <option value="false">Stored</option>
            </Select>
            <Button size="lg" onClick={run} disabled={loading}>
              {loading ? "Loading..." : "Load Items"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Results</h3>
          </div>
          {pageStatus && <StatusBanner kind={pageStatus.kind} title={pageStatus.title} message={pageStatus.message} />}
          {results.length === 0 && !loading && <div className="empty">No items loaded.</div>}
          <div className="list">
            {results.map((item) => (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className="list__row">
                <div>
                  <div className="list__title">{typeNameMap.get(item.type_id) ?? "Item"}</div>
                  <div className="muted">{item.id}</div>
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

export default ListItemsPage;
