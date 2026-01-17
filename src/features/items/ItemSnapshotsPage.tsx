import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteItemSnapshot, listItemSnapshots } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { formatTimestamp } from "@/utils/dates";
import { useToasts } from "@/hooks/useToasts";

const ItemSnapshotsPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const [itemId, setItemId] = useState("");
  const [kind, setKind] = useState("");
  const [limit, setLimit] = useState("20");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ id: string; kind: string; captured_at: string; data_text?: string | null }>>([]);
  const [status, setStatus] = useState<{ kind: "error" | "warning" | "success" | "info"; title: string; message?: string } | null>(null);

  const itemRef = useRef<HTMLInputElement | null>(null);
  const kindRef = useRef<HTMLInputElement | null>(null);
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
      const response = await listItemSnapshots(itemId.trim(), {
        kind: kind.trim() || null,
        limit: limit.trim() ? Number(limit) : null,
        include_deleted: includeDeleted
      });
      setResults(response.map((snap) => ({
        id: snap.id,
        kind: snap.kind,
        captured_at: snap.captured_at,
        data_text: snap.data_text ?? null
      })));
      setStatus({ kind: "success", title: "Snapshots loaded", message: `${response.length} entries` });
    } catch (err) {
      setStatus({ kind: "error", title: "Load failed", message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const onItemEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      kindRef.current?.focus();
    }
  };

  const onKindEnter = (event: KeyboardEvent<HTMLInputElement>) => {
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

  const handleDelete = async (snapshotId: string) => {
    if (!itemId.trim()) {
      setStatus({ kind: "warning", title: "Missing item", message: "Scan or enter item UUID." });
      return;
    }
    const confirmed = window.confirm("Delete this snapshot? It will be hidden unless include_deleted is enabled.");
    if (!confirmed) return;
    setDeletingId(snapshotId);
    try {
      await deleteItemSnapshot(itemId.trim(), snapshotId);
      success("Snapshot deleted", snapshotId);
      setResults((current) => current.filter((snap) => snap.id !== snapshotId));
    } catch (err) {
      error("Delete failed", parseErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (!featureFlags.snapshots) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Snapshots are disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-2">
        <Card className="card--focus">
          <div className="card__header">
            <h2>Item Snapshots</h2>
          </div>
          <div className="form-stack">
            <Input
              className="input--lg"
              placeholder="Item UUID"
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
              onKeyDown={onItemEnter}
              help="Scan the item UUID to retrieve all snapshots for that item."
              ref={itemRef}
            />
            <Input
              placeholder="Snapshot kind (optional)"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              onKeyDown={onKindEnter}
              help="Only show snapshots with a matching kind label; leave blank for all."
              ref={kindRef}
            />
            <Input
              placeholder="Limit (optional)"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              onKeyDown={onLimitEnter}
              help="Set how many snapshots to load; smaller values are faster."
              ref={limitRef}
            />
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(event) => setIncludeDeleted(event.target.checked)}
              />
              <span>Include deleted</span>
            </label>
            <Button size="lg" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Load Snapshots"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Results</h3>
          </div>
          {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}
          {results.length === 0 && !loading && <div className="empty">No snapshots loaded.</div>}
          <div className="list">
            {results.map((snap) => (
              <div key={snap.id} className="list__row">
                <div>
                  <div className="list__title">{snap.kind}</div>
                  <div className="muted">{formatTimestamp(snap.captured_at)}</div>
                </div>
                <div className="muted">{snap.data_text ? snap.data_text.slice(0, 40) : "JSON data"}</div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(snap.id)}
                  disabled={deletingId === snap.id}
                >
                  {deletingId === snap.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ItemSnapshotsPage;
