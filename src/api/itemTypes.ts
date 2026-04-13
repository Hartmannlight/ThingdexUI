import { getThingdexSdk } from "@/api/client";
import type { ItemTypeCreate, ItemTypeOut, ItemTypeUpdate } from "@/api/types";

export const listItemTypes = (params?: { limit?: number | null; offset?: number | null; include_deleted?: boolean | null }) =>
  getThingdexSdk().itemTypes.list(params) as Promise<ItemTypeOut[]>;

export const getItemType = (itemTypeId: string) => getThingdexSdk().itemTypes.get(itemTypeId) as Promise<ItemTypeOut>;

export const createItemType = (payload: ItemTypeCreate) => getThingdexSdk().itemTypes.create(payload) as Promise<ItemTypeOut>;

export const updateItemType = (itemTypeId: string, payload: ItemTypeUpdate) =>
  getThingdexSdk().itemTypes.update(itemTypeId, payload) as Promise<ItemTypeOut>;

export const deleteItemType = (itemTypeId: string) => getThingdexSdk().itemTypes.delete(itemTypeId);
