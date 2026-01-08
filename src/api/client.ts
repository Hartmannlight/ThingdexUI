import { getRuntimeConfig } from "@/config/runtime";
import { ApiError } from "@/api/errors";

const buildQuery = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const parts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return parts.length > 0 ? `?${parts.join("&")}` : "";
};

const REQUEST_TIMEOUT_MS = 15000;

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, unknown>
): Promise<T> => {
  const { apiBaseUrl } = getRuntimeConfig();
  const url = `${apiBaseUrl}${path}${buildQuery(query)}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      signal: controller.signal,
      ...options
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(0, "Request timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "detail" in data ? "Request failed" : response.statusText;
    throw new ApiError(response.status, message || "Request failed", data ?? undefined);
  }

  return data as T;
};
