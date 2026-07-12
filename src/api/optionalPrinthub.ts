import { ApiError } from "@/api/errors";

const normalizeBase = (value: string) => value.replace(/\/+$/, "");

export const getOptionalPrinthub = (baseUrl: string) => {
  const request = async <T>(path: string): Promise<T> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${normalizeBase(baseUrl)}${path}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new ApiError(response.status, `PrintHub request failed (${response.status})`, body);
      }
      return body as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(504, "PrintHub request timed out");
      }
      throw new ApiError(502, error instanceof Error ? error.message : "PrintHub is unavailable");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return {
    listTemplates: () => request<Array<{ id: string; name?: string | null }>>("/v1/templates"),
    getTemplate: (templateId: string) =>
      request<{ id: string; name?: string | null; variables?: Array<Record<string, unknown>> | null }>(
        `/v1/templates/${encodeURIComponent(templateId)}`
      ),
    listPrinters: () => request<{ printers?: Array<Record<string, unknown>> }>("/v1/printers")
  };
};
