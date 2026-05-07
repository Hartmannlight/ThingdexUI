import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bulkMoveItems, getItem, moveItem } from "@/api/items";
import { getLocation, getPath, listChildren, listItemsInLocation, updateLocation } from "@/api/locations";
import { printLabel } from "@/api/labelPrint";
import { parseErrorMessage } from "@/api/errors";
import type { ItemDetailOut, ItemOut, LocationOut, LocationPathItem } from "@/api/types";
import { ActionTile } from "@/components/actions/ActionTile";
import { ItemStatusBadge } from "@/components/entities/ItemStatusBadge";
import { LocationPathBreadcrumb } from "@/components/entities/LocationPathBreadcrumb";
import { LastActionBar } from "@/components/scanner/LastActionBar";
import { ModeBanner } from "@/components/scanner/ModeBanner";
import { NextScanHint } from "@/components/scanner/NextScanHint";
import { getRuntimeConfig } from "@/config/runtime";
import { useToasts } from "@/hooks/useToasts";
import { decideScanAction } from "@/scanner/scanStateMachine";
import type { ScanContext } from "@/scanner/types";
import { useScanner } from "@/scanner/ScannerProvider";
import { itemTitle, itemTypeName, jsonPreview, locationPath, shortId } from "@/utils/entityLabels";

type ItemContext = {
  kind: "item";
  item: ItemDetailOut;
};

type LocationContext = {
  kind: "location";
  location: LocationOut;
  path: LocationPathItem[];
  children: LocationOut[];
  items: ItemOut[];
};

type ContextEntity = ItemContext | LocationContext | null;

type LastAction = {
  text: string;
  time: string;
  undo?: () => Promise<void>;
};

const initialScanContext: ScanContext = {
  mode: "idle",
  bulkItemIds: [],
  autoMove: false
};

const timeNow = () => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const resolveUnknownScan = async (raw: string) => {
  try {
    const item = await getItem(raw);
    return { kind: "item" as const, id: item.id };
  } catch {
    const location = await getLocation(raw);
    return { kind: "location" as const, id: location.id };
  }
};

const ItemContextCard = ({ item }: { item: ItemDetailOut }) => (
  <section className="context-card">
    <div className="section-title">
      <span className="section-title__mark">[]</span>
      Gescanntes Item
    </div>
    <div className="context-card__body context-card__body--item">
      <div className="item-visual">
        <div className="item-visual__cable" />
      </div>
      <div className="context-card__content">
        <h1>{itemTitle(item)}</h1>
        <dl className="meta-list">
          <div>
            <dt>Typ</dt>
            <dd>{itemTypeName(item)}</dd>
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
          <div>
            <dt>Ort</dt>
            <dd>
              <LocationPathBreadcrumb path={item.location?.effective_location_path} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
);

const LocationContextCard = ({ context }: { context: LocationContext }) => (
  <section className="context-card">
    <div className="section-title">
      <span className="section-title__mark">&lt;&gt;</span>
      Gescannter Ort
    </div>
    <div className="context-card__body">
      <div className="location-visual">
        <span>{context.location.kind || "Ort"}</span>
      </div>
      <div className="context-card__content">
        <h1>{context.location.name}</h1>
        <dl className="meta-list">
          <div>
            <dt>Pfad</dt>
            <dd>{locationPath(context.path)}</dd>
          </div>
          <div>
            <dt>Direkte Items</dt>
            <dd>{context.items.length}</dd>
          </div>
          <div>
            <dt>Unterorte</dt>
            <dd>{context.children.length}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{shortId(context.location.id)}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
);

const EmptyScannerState = () => (
  <section className="context-card context-card--empty">
    <div className="section-title">
      <span className="section-title__mark">[]</span>
      Scanner bereit
    </div>
    <div className="empty-workflow">
      <h1>Item oder Ort scannen</h1>
      <p>Die Eingabe oben bleibt aktiv. Nach jedem Scan zeigt Thingdex, was erkannt wurde und was beim nächsten Scan passiert.</p>
    </div>
  </section>
);

const BulkPanel = ({
  scanContext,
  target,
  queuedItems,
  onMoveAll,
  onClear,
  onCancel,
  onToggleAutoMove
}: {
  scanContext: ScanContext;
  target: LocationContext | null;
  queuedItems: ItemDetailOut[];
  onMoveAll: () => void;
  onClear: () => void;
  onCancel: () => void;
  onToggleAutoMove: () => void;
}) => {
  if (scanContext.mode !== "bulk_move") return null;
  return (
    <ModeBanner title={scanContext.autoMove ? "AUTO-MOVE AKTIV" : "Bulk-Modus aktiv"} tone={scanContext.autoMove ? "danger" : "info"}>
      <div className="bulk-panel">
        <div>
          <strong>Zielort:</strong> {target ? locationPath(target.path) : scanContext.targetLocationId}
        </div>
        <div>Jetzt Items scannen.</div>
        <label className="switch-row">
          <input type="checkbox" checked={scanContext.autoMove} onChange={onToggleAutoMove} />
          Sofort verschieben
        </label>
        <div className="bulk-list">
          {queuedItems.length === 0 ? (
            <span className="muted">Noch keine Items gesammelt.</span>
          ) : (
            queuedItems.map((item, index) => (
              <div className="bulk-list__row" key={item.id}>
                <span>{index + 1}.</span>
                <strong>{itemTitle(item)}</strong>
                <span>{shortId(item.id)}</span>
              </div>
            ))
          )}
        </div>
        <div className="inline-actions">
          <button className="button button--primary button--lg" type="button" onClick={onMoveAll} disabled={queuedItems.length === 0}>
            Alle verschieben
          </button>
          <button className="button button--outline button--lg" type="button" onClick={onClear}>
            Liste leeren
          </button>
          <button className="button button--ghost button--lg" type="button" onClick={onCancel}>
            Abbrechen
          </button>
        </div>
      </div>
    </ModeBanner>
  );
};

const ScanPage = () => {
  const { defaults } = getRuntimeConfig();
  const { lastScan } = useScanner();
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const [scanContext, setScanContext] = useState<ScanContext>(initialScanContext);
  const [contextEntity, setContextEntity] = useState<ContextEntity>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queuedItems, setQueuedItems] = useState<ItemDetailOut[]>([]);

  const loadItem = useCallback(async (itemId: string) => {
    const item = await getItem(itemId);
    setContextEntity({ kind: "item", item });
    setScanContext((current) => ({ ...current, mode: "item_context", currentItemId: item.id, currentLocationId: undefined }));
    return item;
  }, []);

  const loadLocation = useCallback(async (locationId: string) => {
    const [location, path, children, items] = await Promise.all([
      getLocation(locationId),
      getPath(locationId),
      listChildren(locationId, { limit: 50 }),
      listItemsInLocation(locationId, false, { limit: 50 })
    ]);
    const next = { kind: "location" as const, location, path, children, items };
    setContextEntity(next);
    setScanContext((current) => ({
      ...current,
      mode: "location_context",
      currentLocationId: location.id,
      currentItemId: undefined
    }));
    return next;
  }, []);

  const handleMoveItem = useCallback(
    async (itemId: string, locationId: string) => {
      const before = await getItem(itemId);
      await moveItem(itemId, { location_id: locationId });
      const moved = await getItem(itemId);
      const path = moved.location?.effective_location_path || (await getPath(locationId));
      await queryClient.invalidateQueries({ queryKey: ["items"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      setContextEntity({ kind: "item", item: moved as ItemDetailOut });
      setScanContext((current) => ({ ...current, mode: "item_context", currentItemId: moved.id }));
      setLastAction({
        text: `${itemTitle(moved)} wurde nach ${locationPath(path)} verschoben.`,
        time: timeNow(),
        undo: before.location_id
          ? async () => {
              await moveItem(itemId, { location_id: before.location_id! });
              await loadItem(itemId);
            }
          : undefined
      });
      toasts.success("Item verschoben", `${itemTitle(moved)} -> ${locationPath(path)}`);
    },
    [loadItem, queryClient, toasts]
  );

  useEffect(() => {
    if (!lastScan) return;
    let cancelled = false;
    const run = async () => {
      setBusy(true);
      setErrorText(null);
      try {
        const recognized =
          lastScan.parsed.kind === "unknown"
            ? await resolveUnknownScan(lastScan.raw)
            : lastScan.parsed.kind === "item" || lastScan.parsed.kind === "location"
              ? { kind: lastScan.parsed.kind, id: lastScan.parsed.id }
              : null;

        if (!recognized) {
          throw new Error("Dieser Scan-Code wird hier noch nicht unterstützt.");
        }

        const decision = decideScanAction(scanContext, recognized);
        if (decision.action === "show_item") {
          const item = await loadItem(decision.itemId);
          setLastAction({ text: `${itemTitle(item)} geöffnet.`, time: timeNow() });
        }
        if (decision.action === "show_location") {
          const location = await loadLocation(decision.locationId);
          setLastAction({ text: `${location.location.name} geöffnet.`, time: timeNow() });
        }
        if (decision.action === "move_item") {
          await handleMoveItem(decision.itemId, decision.locationId);
        }
        if (decision.action === "bulk_add_item") {
          const item = await getItem(decision.itemId);
          setQueuedItems((current) => (current.some((entry) => entry.id === item.id) ? current : [...current, item]));
          setScanContext((current) => ({ ...current, bulkItemIds: [...new Set([...current.bulkItemIds, item.id])] }));
          setLastAction({ text: `${itemTitle(item)} zur Bulk-Liste hinzugefügt.`, time: timeNow() });
        }
        if (decision.action === "bulk_auto_move_item") {
          await handleMoveItem(decision.itemId, decision.locationId);
          setScanContext((current) => ({ ...current, mode: "bulk_move", targetLocationId: decision.locationId }));
        }
        if (decision.action === "move_location") {
          await updateLocation(decision.locationId, { parent_id: decision.targetLocationId });
          const targetPath = await getPath(decision.targetLocationId);
          const moved = await loadLocation(decision.locationId);
          setLastAction({ text: `${moved.location.name} wurde unter ${locationPath(targetPath)} verschoben.`, time: timeNow() });
        }
        if (decision.action === "ignore") {
          toasts.warning("Scan ignoriert", decision.reason);
        }
      } catch (error) {
        if (!cancelled) {
          const message = parseErrorMessage(error);
          setErrorText(message);
          toasts.error("Scan fehlgeschlagen", message);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [handleMoveItem, lastScan, loadItem, loadLocation, scanContext, toasts]);

  const targetContext = contextEntity?.kind === "location" ? contextEntity : null;
  const nextScanLines = useMemo(() => {
    if (scanContext.mode === "bulk_move") {
      return [{ when: "Item scannen", then: scanContext.autoMove ? "sofort verschieben" : "zur Liste hinzufügen" }];
    }
    if (contextEntity?.kind === "item") {
      return [
        { when: "Ort scannen", then: "Item wird verschoben" },
        { when: "Item scannen", then: "anderes Item öffnen" }
      ];
    }
    if (contextEntity?.kind === "location") {
      return [
        { when: "Item scannen", then: "Item öffnen" },
        { when: "Ort scannen", then: "anderen Ort öffnen" }
      ];
    }
    return [
      { when: "Item scannen", then: "Item anzeigen" },
      { when: "Ort scannen", then: "Ort anzeigen" }
    ];
  }, [contextEntity, scanContext]);

  const printCurrentLabel = async () => {
    if (!contextEntity) return;
    try {
      const printerId = defaults.defaultPrinterId || "Zebra-01";
      const templateId =
        contextEntity.kind === "location" && isRecord(contextEntity.location.meta)
          ? typeof contextEntity.location.meta.label_template_id === "string"
            ? contextEntity.location.meta.label_template_id
            : null
          : null;
      await printLabel({
        printer_id: printerId,
        item_id: contextEntity.kind === "item" ? contextEntity.item.id : null,
        location_id: contextEntity.kind === "location" ? contextEntity.location.id : null,
        template_id: templateId,
        return_preview: false
      });
      toasts.success("Label gesendet", `Drucker: ${printerId}`);
    } catch (error) {
      toasts.error("Label konnte nicht gedruckt werden", parseErrorMessage(error));
    }
  };

  const moveBulkItems = async () => {
    if (!scanContext.targetLocationId || queuedItems.length === 0) return;
    try {
      await bulkMoveItems({ item_ids: queuedItems.map((item) => item.id), location_id: scanContext.targetLocationId });
      setLastAction({ text: `${queuedItems.length} Items gesammelt verschoben.`, time: timeNow() });
      setQueuedItems([]);
      setScanContext((current) => ({ ...current, bulkItemIds: [] }));
      toasts.success("Bulk-Move abgeschlossen", `${queuedItems.length} Items verschoben.`);
    } catch (error) {
      toasts.error("Bulk-Move fehlgeschlagen", parseErrorMessage(error));
    }
  };

  return (
    <div className="scan-page">
      {busy && <div className="inline-loading">Scan wird verarbeitet ...</div>}
      {errorText && <div className="error-panel">{errorText}</div>}

      {contextEntity?.kind === "item" && <ItemContextCard item={contextEntity.item} />}
      {contextEntity?.kind === "location" && <LocationContextCard context={contextEntity} />}
      {!contextEntity && <EmptyScannerState />}

      <BulkPanel
        scanContext={scanContext}
        target={targetContext}
        queuedItems={queuedItems}
        onMoveAll={() => void moveBulkItems()}
        onClear={() => {
          setQueuedItems([]);
          setScanContext((current) => ({ ...current, bulkItemIds: [] }));
        }}
        onCancel={() => {
          setQueuedItems([]);
          setScanContext((current) => ({ ...current, mode: targetContext ? "location_context" : "idle", bulkItemIds: [] }));
        }}
        onToggleAutoMove={() => setScanContext((current) => ({ ...current, autoMove: !current.autoMove }))}
      />

      <NextScanHint lines={nextScanLines} />

      <section className="action-section">
        <div className="section-title">
          <span className="section-title__mark">!!</span>
          Aktionen
        </div>
        <div className="action-grid">
          <ActionTile
            mark="-&gt;"
            title="Verschieben"
            detail={contextEntity?.kind === "item" ? "Ort scannen" : "Ziel auswählen"}
            disabled={!contextEntity}
          />
          <ActionTile mark="PR" title="Label drucken" detail="Neues Label" disabled={!contextEntity} onClick={() => void printCurrentLabel()} />
          <ActionTile mark="ED" title="Bearbeiten" detail="Details ändern" disabled={!contextEntity} />
          <ActionTile
            mark="BX"
            title={contextEntity?.kind === "location" ? "Items hierhin scannen" : "Inhalt anzeigen"}
            detail={contextEntity?.kind === "location" ? "Bulk-Modus" : "Ort / Item öffnen"}
            disabled={!contextEntity}
            onClick={() => {
              if (contextEntity?.kind === "location") {
                setScanContext({
                  ...scanContext,
                  mode: "bulk_move",
                  targetLocationId: contextEntity.location.id,
                  currentLocationId: contextEntity.location.id
                });
              }
            }}
          />
          <ActionTile mark="RL" title="Beziehungen" detail="Verknüpfungen" disabled={contextEntity?.kind !== "item"} />
          <ActionTile mark="T" title="Verlauf" detail="Letzte Aktionen" disabled={!contextEntity} />
        </div>
      </section>

      {lastAction && (
        <div className="last-action-row">
          <LastActionBar text={lastAction.text} time={lastAction.time} />
          {lastAction.undo && (
            <button className="button button--outline" type="button" onClick={() => void lastAction.undo?.()}>
              Rückgängig
            </button>
          )}
        </div>
      )}

      {contextEntity?.kind === "item" && (
        <section className="details-panel">
          <h2>Eigenschaften</h2>
          <div className="props-table">
            {Object.entries(contextEntity.item.props || {}).map(([key, value]) => (
              <div key={key}>
                <strong>{key}</strong>
                <span>{jsonPreview(value)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ScanPage;
