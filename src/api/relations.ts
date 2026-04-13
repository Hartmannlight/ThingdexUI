import { getThingdexSdk } from "@/api/client";
import type { ItemRelationCreate, ItemRelationDetach, ItemRelationOut, ItemRelationUpdate } from "@/api/types";

export const createRelation = (parentItemId: string, payload: ItemRelationCreate) =>
  getThingdexSdk().relations.create(parentItemId, payload) as Promise<ItemRelationOut>;

export const listChildRelations = (itemId: string, params?: { active_only?: boolean | null; include_deleted?: boolean | null }) =>
  getThingdexSdk().relations.listChildren(itemId, params) as Promise<ItemRelationOut[]>;

export const listParentRelations = (itemId: string, params?: { active_only?: boolean | null; include_deleted?: boolean | null }) =>
  getThingdexSdk().relations.listParents(itemId, params) as Promise<ItemRelationOut[]>;

export const updateRelation = (relationId: string, payload: ItemRelationUpdate) =>
  getThingdexSdk().relations.update(relationId, payload) as Promise<ItemRelationOut>;

export const detachRelation = (relationId: string, payload: ItemRelationDetach) =>
  getThingdexSdk().relations.detach(relationId, payload) as Promise<ItemRelationOut>;

export const deleteRelation = (relationId: string) => getThingdexSdk().relations.delete(relationId);
