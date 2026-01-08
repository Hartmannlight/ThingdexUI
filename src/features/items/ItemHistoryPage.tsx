import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { getItemHistory } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";

const ItemHistoryPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const [itemId, setItemId] = useState("");
  const [propKey, setPropKey] = useState("");
  const [limit, setLimit] = useState("200");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    Array<{ id: string; prop_key: string; captured_at: string; value: unknown; source?: string | null }>
  >([]);
  const [status, setStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);

  const itemRef = useRef<HTMLInputElement | null>(null);
  const keyRef = useRef<HTMLInputElement | null>(null);
  const limitRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    itemRef.current?.focus();
  }, []);

  const load = async () => {
    if (!itemId.trim()) {
      setStatus({ kind: "warning", title: "Missing item", message: "Scan or enter item UUID." });
      itemRef.current?.focus();
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await getItemHistory(itemId.trim(), {
        prop_key: propKey.trim() || null,
        limit: limit.trim() ? Number(limit) : null
      });
      setResults(response);
      setStatus({ kind: "success", title: "History loaded", message: `${response.length} entries` });
    } catch (err) {
      setStatus({ kind: "error", title: "Load failed", message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const onItemEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      keyRef.current?.focus();
    }
  };

  const onKeyEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      limitRef.current?.focus();
    }
  };

  const onLimitEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void load();
    }
  };

  if (!featureFlags.inventory) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="History is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header">
            <h2>Item History</h2>
          </div>
          <div className="form-stack">
            <Input
              className="input--lg"
              placeholder="Item UUID"
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
              onKeyDown={onItemEnter}
              help="Scan the item UUID to load its property change history."
              ref={itemRef}
            />
            <Input
              placeholder="Property key (optional)"
              value={propKey}
              onChange={(event) => setPropKey(event.target.value)}
              onKeyDown={onKeyEnter}
              help="Limit the history to one property key; leave blank for all keys."
              ref={keyRef}
            />
            <Input
              placeholder="Limit (optional)"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              onKeyDown={onLimitEnter}
              help="Set how many entries to fetch; smaller numbers load faster."
              ref={limitRef}
            />
            <Button size="lg" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Load History"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Results</h3>
          </div>
          {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
          {results.length === 0 && !loading && <div className="empty">No history loaded.</div>}
          <div className="list">
            {results.map((entry) => (
              <div key={entry.id} className="list__row">
                <div>
                  <div className="list__title">{entry.prop_key}</div>
                  <div className="muted">{entry.captured_at}</div>
                </div>
                <div className="muted">{JSON.stringify(entry.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ItemHistoryPage;
