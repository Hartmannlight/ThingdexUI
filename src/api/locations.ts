import { apiRequest } from "@/api/client";
import type { ItemOut, LocationCreate, LocationOut, LocationPathItem, LocationTreeNode, LocationUpdate } from "@/api/types";

export const createLocation = (payload: LocationCreate) =>
  apiRequest<LocationOut>("/v1/locations", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getLocation = (locationId: string) =>
  apiRequest<LocationOut>(`/v1/locations/${locationId}`);

export const updateLocation = (locationId: string, payload: LocationUpdate) =>
  apiRequest<LocationOut>(`/v1/locations/${locationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const deleteLocation = (locationId: string) =>
  apiRequest<void>(`/v1/locations/${locationId}`, {
    method: "DELETE"
  });

export const listChildren = (
  locationId: string,
  params?: { limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) => apiRequest<LocationOut[]>(`/v1/locations/${locationId}/children`, {}, params ?? undefined);

export const getPath = (locationId: string) =>
  apiRequest<LocationPathItem[]>(`/v1/locations/${locationId}/path`);

export const listItemsInLocation = (
  locationId: string,
  includeDescendants = false,
  params?: { limit?: number | null; offset?: number | null; include_deleted?: boolean | null }
) =>
  apiRequest<ItemOut[]>(
    `/v1/locations/${locationId}/items`,
    {},
    {
      include_descendants: includeDescendants,
      include_deleted: params?.include_deleted ?? undefined,
      limit: params?.limit ?? undefined,
      offset: params?.offset ?? undefined
    }
  );

export const getRootLocation = () => apiRequest<LocationOut>("/v1/locations/root");

export const getLocationTree = (params?: { root_location_id?: string | null; include_deleted?: boolean | null }) =>
  apiRequest<LocationTreeNode>("/v1/locations/tree", {}, params ?? undefined);
