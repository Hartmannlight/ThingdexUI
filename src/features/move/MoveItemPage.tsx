import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StatusBanner } from "@/components/StatusBanner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLocation, getPath } from "@/api/locations";
import { getItem, moveItem } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { useBootstrapRootLocation } from "@/hooks/useBootstrapRootLocation";

const MoveItemPage = () => {
  const { featureFlags } = getRuntimeConfig();
  const { success, error } = useToasts();
  const rootLocationId = useBootstrapRootLocation();

  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "warning" | "error" | "info"; title: string; message?: string } | null>(null);
  const [moving, setMoving] = useState(false);

  const itemQuery = useQuery({
    queryKey: ["move-item", itemId],
    queryFn: () => getItem(itemId),
    enabled: itemId.length > 0
  });

  const locationQuery = useQuery({
    queryKey: ["move-location", locationId],
    queryFn: () => getLocation(locationId),
    enabled: locationId.length > 0
  });

  const pathQuery = useQuery({
    queryKey: ["move-location", locationId, "path"],
    queryFn: () => getPath(locationId),
    enabled: locationId.length > 0
  });

  const itemInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    itemInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!locationId && rootLocationId) {
      setLocationId(rootLocationId);
    }
  }, [locationId, rootLocationId]);

  const move = async () => {
    if (!itemId.trim()) {
      setStatus({ kind: "warning", title: "Scan item first", message: "Item ID is required." });
      itemInputRef.current?.focus();
      return;
    }
    if (!locationId.trim()) {
      setStatus({ kind: "warning", title: "Scan location", message: "Destination location is required." });
      locationInputRef.current?.focus();
      return;
    }
    setMoving(true);
    try {
      await moveItem(itemId.trim(), { location_id: locationId.trim() });
      success("Item moved", `${itemId} -> ${locationId}`);
      setStatus({ kind: "success", title: "Move complete", message: "Ready for next scan." });
      setItemId("");
      setLocationId(rootLocationId ?? "");
      itemInputRef.current?.focus();
    } catch (err) {
      error("Move failed", parseErrorMessage(err));
      setStatus({ kind: "error", title: "Move failed", message: parseErrorMessage(err) });
    } finally {
      setMoving(false);
    }
  };

  const itemSummary = useMemo(() => {
    if (!itemQuery.data) return null;
    return `${itemQuery.data.id} (${itemQuery.data.type?.name ?? itemQuery.data.type_id})`;
  }, [itemQuery.data]);

  const handleItemKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        locationInputRef.current?.focus();
        locationInputRef.current?.select();
      }
    },
    []
  );

  const handleLocationKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void move();
      }
    },
    [move]
  );

  if (!featureFlags.moveWorkflow) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Move workflow is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="move-grid">
        <Card className="card--focus">
          <div className="card__header">
            <h2>Move Item</h2>
          </div>
          {status && <StatusBanner kind={status.kind} title={status.title} message={status.message} />}

          <div className="move-steps">
            <div className="move-step">
              <div className="move-step__title">1. Scan item</div>
              <div className="move-step__row">
                <Input
                  className="input--lg"
                  placeholder="Item ID"
                  value={itemId}
                  onChange={(event) => setItemId(event.target.value)}
                  onKeyDown={handleItemKey}
                  help="Scan the item UUID; pressing Enter jumps to the destination field."
                  ref={itemInputRef}
                />
              </div>
              {itemQuery.isLoading && <div className="muted">Loading item...</div>}
              {itemSummary && <div className="pill">{itemSummary}</div>}
              {itemQuery.isError && (
                <StatusBanner kind="error" title="Item not found" message={parseErrorMessage(itemQuery.error)} />
              )}
            </div>

            <div className="move-step">
              <div className="move-step__title">2. Scan destination</div>
              <div className="move-step__row">
                <Input
                  className="input--lg"
                  placeholder="Destination location ID"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={handleLocationKey}
                  help="Scan where the item should be stored; Enter confirms the move."
                  ref={locationInputRef}
                />
              </div>
              {locationQuery.isLoading && <div className="muted">Loading location...</div>}
              {locationQuery.data && <div className="pill">{locationQuery.data.name}</div>}
              {locationQuery.isError && (
                <StatusBanner kind="error" title="Location not found" message={parseErrorMessage(locationQuery.error)} />
              )}
              {pathQuery.data && <Breadcrumbs path={pathQuery.data} />}
            </div>

            <div className="move-step move-step--confirm">
              <div className="move-step__title">3. Confirm move</div>
              <div className="muted">Press Enter in destination field to confirm.</div>
              <div className="move-step__row">
                <Button size="lg" onClick={move} disabled={moving}>
                  {moving ? "Moving..." : "Confirm Move"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => {
                    setItemId("");
                    setLocationId(rootLocationId ?? "");
                    setStatus({ kind: "info", title: "Reset", message: "Ready for new scan." });
                    itemInputRef.current?.focus();
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <h3>Recovery</h3>
          </div>
          <div className="form-stack">
            <Button variant="outline" onClick={() => itemInputRef.current?.focus()}>
              Rescan item
            </Button>
            <Button variant="outline" onClick={() => locationInputRef.current?.focus()}>
              Rescan location
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setItemId("");
                setLocationId(rootLocationId ?? "");
                setStatus({ kind: "warning", title: "Cleared", message: "Ready for new scan." });
                itemInputRef.current?.focus();
              }}
            >
              Clear both
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MoveItemPage;
