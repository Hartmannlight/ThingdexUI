import { apiRequest } from "@/api/client";
import type { ItemRelationCreate, ItemRelationDetach, ItemRelationOut, ItemRelationUpdate } from "@/api/types";

export const createRelation = (parentItemId: string, payload: ItemRelationCreate) =>
  apiRequest<ItemRelationOut>(`/v1/items/${parentItemId}/relations`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const listChildRelations = (itemId: string, params?: { active_only?: boolean }) =>
  apiRequest<ItemRelationOut[]>(`/v1/items/${itemId}/relations/children`, {}, params ?? undefined);

export const listParentRelations = (itemId: string, params?: { active_only?: boolean }) =>
  apiRequest<ItemRelationOut[]>(`/v1/items/${itemId}/relations/parents`, {}, params ?? undefined);

export const updateRelation = (relationId: string, payload: ItemRelationUpdate) =>
  apiRequest<ItemRelationOut>(`/v1/relations/${relationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const detachRelation = (relationId: string, payload: ItemRelationDetach) =>
  apiRequest<ItemRelationOut>(`/v1/relations/${relationId}/detach`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
