import { getOptionalPrinthub } from "@/api/optionalPrinthub";
import { getRuntimeConfig } from "@/config/runtime";

export type PrinterSummary = {
  id: string;
  name?: string | null;
};

export const listPrinters = async () => {
  const data = await getOptionalPrinthub(getRuntimeConfig().printerHubBaseUrl).listPrinters();
  return (data.printers ?? []).map((printer) => ({
    id: String(printer.id),
    name: typeof printer.name === "string" ? printer.name : null
  })) as PrinterSummary[];
};
