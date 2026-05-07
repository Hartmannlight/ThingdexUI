import { getRuntimeConfig } from "@/config/runtime";

export type HealthStatus = {
  ok: boolean;
  statusText: string;
};

export const getHealth = async (): Promise<HealthStatus> => {
  const { apiBaseUrl } = getRuntimeConfig();
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/health`);
  if (!response.ok) {
    return { ok: false, statusText: response.statusText || `HTTP ${response.status}` };
  }
  return { ok: true, statusText: "online" };
};
