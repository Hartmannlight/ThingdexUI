import { apiRequest } from "@/api/client";
import type { LabelReprintRequest } from "@/api/types";

export const printLabel = (payload: LabelReprintRequest) =>
  apiRequest<{ status?: string }>("/v1/labels/print", {
    method: "POST",
    body: JSON.stringify(payload)
  });
