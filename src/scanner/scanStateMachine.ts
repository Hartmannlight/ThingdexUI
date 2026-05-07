import type { EntityKind, ScanContext } from "@/scanner/types";

export type ScanDecision =
  | { action: "show_item"; itemId: string }
  | { action: "show_location"; locationId: string }
  | { action: "move_item"; itemId: string; locationId: string }
  | { action: "bulk_add_item"; itemId: string }
  | { action: "bulk_auto_move_item"; itemId: string; locationId: string }
  | { action: "move_location"; locationId: string; targetLocationId: string }
  | { action: "ignore"; reason: string };

export const decideScanAction = (
  context: ScanContext,
  recognized: { kind: EntityKind; id: string }
): ScanDecision => {
  if (context.mode === "item_context" && context.currentItemId) {
    if (recognized.kind === "location") {
      return { action: "move_item", itemId: context.currentItemId, locationId: recognized.id };
    }
    return { action: "show_item", itemId: recognized.id };
  }

  if (context.mode === "location_context") {
    if (recognized.kind === "item") return { action: "show_item", itemId: recognized.id };
    return { action: "show_location", locationId: recognized.id };
  }

  if (context.mode === "bulk_move" && context.targetLocationId) {
    if (recognized.kind === "item") {
      if (context.autoMove) {
        return { action: "bulk_auto_move_item", itemId: recognized.id, locationId: context.targetLocationId };
      }
      return { action: "bulk_add_item", itemId: recognized.id };
    }
    return { action: "show_location", locationId: recognized.id };
  }

  if (context.mode === "move_location" && context.currentLocationId) {
    if (recognized.kind === "location") {
      return { action: "move_location", locationId: context.currentLocationId, targetLocationId: recognized.id };
    }
    return { action: "ignore", reason: "Zum Verschieben eines Orts muss ein Zielort gescannt werden." };
  }

  if (recognized.kind === "item") return { action: "show_item", itemId: recognized.id };
  return { action: "show_location", locationId: recognized.id };
};
