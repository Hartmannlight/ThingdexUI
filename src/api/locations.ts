import { apiRequest } from "@/api/client";
import type { ItemOut, LocationCreate, LocationOut, LocationPathItem, LocationUpdate } from "@/api/types";

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

export const listChildren = (locationId: string) =>
  apiRequest<LocationOut[]>(`/v1/locations/${locationId}/children`);

export const getPath = (locationId: string) =>
  apiRequest<LocationPathItem[]>(`/v1/locations/${locationId}/path`);

export const listItemsInLocation = (locationId: string, includeDescendants = false) =>
  apiRequest<ItemOut[]>(
    `/v1/locations/${locationId}/items`,
    {},
    {
      include_descendants: includeDescendants
    }
  );

export const getRootLocation = () => apiRequest<LocationOut>("/v1/locations/root");
