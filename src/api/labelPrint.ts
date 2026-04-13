import { getThingdexSdk } from "@/api/client";
import type { LabelReprintRequest } from "@/api/types";

export const printLabel = (payload: LabelReprintRequest) => getThingdexSdk().labels.print(payload);
