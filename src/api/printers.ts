import { getRuntimeConfig } from "@/config/runtime";
import { externalRequest } from "@/api/external";

export type PrinterSummary = {
  id: string;
  name?: string | null;
};

export const listPrinters = async () => {
  const { printerHubBaseUrl } = getRuntimeConfig();
  const data = await externalRequest<unknown>(printerHubBaseUrl, "/printers");
  if (Array.isArray(data)) return data as PrinterSummary[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const items = record.printers ?? record.data ?? record.results;
    if (Array.isArray(items)) return items as PrinterSummary[];
  }
  return [];
};
