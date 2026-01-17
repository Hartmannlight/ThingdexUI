import { apiRequest } from "@/api/client";
import type {
  ItemCreate,
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
}) => apiRequest<ItemOut[]>("/v1/items", {}, filters ?? undefined);

export const getItem = (itemId: string) => apiRequest<ItemDetailOut>(`/v1/items/${itemId}`);

export const createItem = (payload: ItemCreate) =>
  apiRequest<ItemOut>("/v1/items", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const deleteItem = (itemId: string) =>
  apiRequest<void>(`/v1/items/${itemId}`, {
    method: "DELETE"
  });

export const bulkCreateItems = (payload: ItemBulkCreate) =>
  apiRequest<ItemOut[]>("/v1/items/bulk", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const bulkUpdateItems = (payload: ItemBulkUpdate) =>
  apiRequest<ItemOut[]>("/v1/items/bulk", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const bulkMoveItems = (payload: ItemBulkMove) =>
  apiRequest<ItemOut[]>("/v1/items/bulk/move", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const updateItem = (itemId: string, payload: ItemUpdate) =>
  apiRequest<ItemOut>(`/v1/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const moveItem = (itemId: string, payload: ItemMove) =>
  apiRequest<ItemOut>(`/v1/items/${itemId}/move`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const mergeItemProps = (itemId: string, payload: ItemPropsUpdate) =>
  apiRequest<ItemOut>(`/v1/items/${itemId}/props`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const replaceItemProps = (itemId: string, payload: ItemPropsReplace) =>
  apiRequest<ItemOut>(`/v1/items/${itemId}/props`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const getItemHistory = (
  itemId: string,
  params?: { prop_key?: string | null; limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) =>
  apiRequest<ItemPropHistoryOut[]>(`/v1/items/${itemId}/history`, {}, params ?? undefined);

export const listItemSnapshots = (
  itemId: string,
  params?: { kind?: string | null; limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) =>
  apiRequest<ItemSnapshotOut[]>(`/v1/items/${itemId}/snapshots`, {}, params ?? undefined);

export const createItemSnapshot = (itemId: string, payload: ItemSnapshotCreate) =>
  apiRequest<ItemSnapshotOut>(`/v1/items/${itemId}/snapshots`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const deleteItemSnapshot = (itemId: string, snapshotId: string) =>
  apiRequest<void>(`/v1/items/${itemId}/snapshots/${snapshotId}`, {
    method: "DELETE"
  });

export const searchItems = (payload: SearchRequest) =>
  apiRequest<ItemOut[]>("/v1/items/search", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const listItemsMissingLocation = () => apiRequest<ItemDetailOut[]>("/v1/items/missing-location");
