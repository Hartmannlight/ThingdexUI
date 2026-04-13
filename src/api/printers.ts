import { getPrinthubSdk } from "@/api/client";

export type PrinterSummary = {
  id: string;
  name?: string | null;
};

export const listPrinters = async () => {
  const data = await getPrinthubSdk().printers.list();
  return (data.printers ?? []).map((printer) => ({
    id: String(printer.id),
    name: typeof printer.name === "string" ? printer.name : null
  })) as PrinterSummary[];
};
