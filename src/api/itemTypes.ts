import { apiRequest } from "@/api/client";
import type { ItemTypeCreate, ItemTypeOut, ItemTypeUpdate } from "@/api/types";

export const listItemTypes = () => apiRequest<ItemTypeOut[]>("/v1/item-types");

export const getItemType = (itemTypeId: string) =>
  apiRequest<ItemTypeOut>(`/v1/item-types/${itemTypeId}`);

export const createItemType = (payload: ItemTypeCreate) =>
  apiRequest<ItemTypeOut>("/v1/item-types", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateItemType = (itemTypeId: string, payload: ItemTypeUpdate) =>
  apiRequest<ItemTypeOut>(`/v1/item-types/${itemTypeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
