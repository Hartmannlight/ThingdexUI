import type { ItemDetailOut, ItemOut, LocationPathItem } from "@/api/types";

export const itemTitle = (item: Pick<ItemOut, "description" | "id">) => item.description?.trim() || item.id;

export const itemTypeName = (item: ItemDetailOut | ItemOut) => {
  if ("type" in item && item.type?.name) return item.type.name;
  return item.type_id;
};

export const locationPath = (path?: LocationPathItem[] | null) => {
  if (!path || path.length === 0) return "Kein Ort";
  return path.map((entry) => entry.name).join(" / ");
};

export const shortId = (id: string) => id.slice(0, 8);

export const jsonPreview = (value: unknown) => {
  if (value == null) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
