import { getThingdexSdk } from "@/api/client";
import type {
  ItemCreate,
  ItemCreateResponse,
  ItemDetailOut,
  ItemBulkCreate,
  ItemBulkUpdate,
  ItemBulkMove,
  ItemMove,
  ItemOut,
  ItemPropsReplace,
  ItemPropsUpdate,
  ItemUpdate,
  ItemPropHistoryOut,
  ItemSnapshotCreate,
  ItemSnapshotOut,
  SearchRequest
} from "@/api/types";

export const listItems = (filters?: {
  type?: string | null;
  status?: string | null;
  in_use?: boolean | null;
  limit?: number | null;
  offset?: number | null;
  include_deleted?: boolean | null;
}) => getThingdexSdk().items.list(filters) as Promise<ItemOut[]>;

export const getItem = (itemId: string) => getThingdexSdk().items.get(itemId) as Promise<ItemDetailOut>;

export const createItem = (payload: ItemCreate) =>
  getThingdexSdk().items.createWithSideEffects(payload) as Promise<ItemCreateResponse>;

export const deleteItem = (itemId: string) => getThingdexSdk().items.delete(itemId);

export const bulkCreateItems = (payload: ItemBulkCreate) => getThingdexSdk().items.bulkCreate(payload) as Promise<ItemOut[]>;

export const bulkUpdateItems = (payload: ItemBulkUpdate) => getThingdexSdk().items.bulkUpdate(payload) as Promise<ItemOut[]>;

export const bulkMoveItems = (payload: ItemBulkMove) => getThingdexSdk().items.bulkMove(payload) as Promise<ItemOut[]>;

export const updateItem = (itemId: string, payload: ItemUpdate) => getThingdexSdk().items.update(itemId, payload) as Promise<ItemOut>;

export const moveItem = (itemId: string, payload: ItemMove) => getThingdexSdk().items.move(itemId, payload) as Promise<ItemOut>;

export const mergeItemProps = (itemId: string, payload: ItemPropsUpdate) =>
  getThingdexSdk().items.mergeProps(itemId, payload) as Promise<ItemOut>;

export const replaceItemProps = (itemId: string, payload: ItemPropsReplace) =>
  getThingdexSdk().items.replaceProps(itemId, payload) as Promise<ItemOut>;

export const getItemHistory = (
  itemId: string,
  params?: { prop_key?: string | null; limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) => getThingdexSdk().items.history(itemId, params) as Promise<ItemPropHistoryOut[]>;

export const listItemSnapshots = (
  itemId: string,
  params?: { kind?: string | null; limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) => getThingdexSdk().items.listSnapshots(itemId, params) as Promise<ItemSnapshotOut[]>;

export const createItemSnapshot = (itemId: string, payload: ItemSnapshotCreate) =>
  getThingdexSdk().items.createSnapshot(itemId, payload) as Promise<ItemSnapshotOut>;

export const deleteItemSnapshot = (itemId: string, snapshotId: string) => getThingdexSdk().items.deleteSnapshot(itemId, snapshotId);

export const searchItems = (payload: SearchRequest) => getThingdexSdk().items.search(payload) as Promise<ItemOut[]>;

export const listItemsMissingLocation = () => getThingdexSdk().items.listMissingLocation() as Promise<ItemDetailOut[]>;
