export type EntityKind = "item" | "location";

export type ParsedScan =
  | { kind: "item"; id: string; raw: string }
  | { kind: "location"; id: string; raw: string }
  | { kind: "item_type"; id: string; raw: string }
  | { kind: "unknown"; raw: string };

export type ScanMode = "idle" | "item_context" | "location_context" | "bulk_move" | "move_location";

export type ScanEvent = {
  id: number;
  raw: string;
  parsed: ParsedScan;
  at: Date;
};

export interface ScanContext {
  mode: ScanMode;
  currentItemId?: string;
  currentLocationId?: string;
  targetLocationId?: string;
  bulkItemIds: string[];
  autoMove: boolean;
}
