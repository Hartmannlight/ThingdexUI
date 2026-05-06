import { getThingdexSdk } from "@/api/client";
import type { ItemOut, LocationCreate, LocationOut, LocationPathItem, LocationTreeNode, LocationUpdate } from "@/api/types";

export const createLocation = (payload: LocationCreate) => getThingdexSdk().locations.create(payload) as Promise<LocationOut>;

export const getLocation = (locationId: string) => getThingdexSdk().locations.get(locationId) as Promise<LocationOut>;

export const updateLocation = (locationId: string, payload: LocationUpdate) =>
  getThingdexSdk().locations.update(locationId, payload) as Promise<LocationOut>;

export const deleteLocation = (locationId: string) => getThingdexSdk().locations.delete(locationId);

export const listChildren = (
  locationId: string,
  params?: { limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) => getThingdexSdk().locations.listChildren(locationId, params) as Promise<LocationOut[]>;

export const getPath = (locationId: string) => getThingdexSdk().locations.getPath(locationId) as Promise<LocationPathItem[]>;

export const listItemsInLocation = (
  locationId: string,
  includeDescendants = false,
  params?: { limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) =>
  getThingdexSdk().locations.listItems(locationId, {
    include_descendants: includeDescendants,
    include_deleted: params?.include_deleted ?? undefined,
    limit: params?.limit ?? undefined,
    offset: params?.offset ?? undefined
  }) as Promise<ItemOut[]>;

export const getRootLocation = () => getThingdexSdk().locations.getRoot() as Promise<LocationOut>;

export const bootstrapRootLocation = () => getThingdexSdk().locations.bootstrapRoot() as Promise<LocationOut>;

export const getLocationTree = (params?: { root_location_id?: string | null; include_deleted?: boolean | null }) =>
  getThingdexSdk().locations.getTree(params) as Promise<LocationTreeNode>;
