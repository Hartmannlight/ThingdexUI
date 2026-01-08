import { ApiError } from "@/api/errors";

const normalizeBase = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const externalRequest = async <T>(baseUrl: string, path: string): Promise<T> => {
  const url = `${normalizeBase(baseUrl)}${normalizePath(path)}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw error;
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
