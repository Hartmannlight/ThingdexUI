import { getRuntimeConfig } from "@/config/runtime";

export type LabelProfile = {
  id: string;
  name: string;
  entity_kind: "item" | "location";
  item_type_id: string | null;
  location_kind: string | null;
  template_id: string;
  printer_id: string;
  auto_print: boolean;
  bindings: Record<string, string>;
  enabled: boolean;
};

export type LabelProfileCreate = Omit<LabelProfile, "id">;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const baseUrl = getRuntimeConfig().apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: unknown } | null;
    throw new Error(typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
};

export const listLabelProfiles = () => request<LabelProfile[]>("/v1/label-profiles");

export const createLabelProfile = (payload: LabelProfileCreate) =>
  request<LabelProfile>("/v1/label-profiles", { method: "POST", body: JSON.stringify(payload) });

export const deleteLabelProfile = (profileId: string) =>
  request<void>(`/v1/label-profiles/${encodeURIComponent(profileId)}`, { method: "DELETE" });
