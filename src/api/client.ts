import { createPrinthubSdk } from "@printhub/sdk";
import { createThingdexSdk } from "@thingdex/sdk";

import { getRuntimeConfig } from "@/config/runtime";

const REQUEST_TIMEOUT_MS = 15000;

let thingdexCache: ReturnType<typeof createThingdexSdk> | null = null;
let thingdexCacheBaseUrl = "";
let printhubCache: ReturnType<typeof createPrinthubSdk> | null = null;
let printhubCacheBaseUrl = "";
let labelServiceCache: ReturnType<typeof createPrinthubSdk> | null = null;
let labelServiceCacheBaseUrl = "";

export const getThingdexSdk = () => {
  const { apiBaseUrl } = getRuntimeConfig();
  if (!thingdexCache || thingdexCacheBaseUrl !== apiBaseUrl) {
    thingdexCacheBaseUrl = apiBaseUrl;
    thingdexCache = createThingdexSdk({ baseUrl: apiBaseUrl, timeoutMs: REQUEST_TIMEOUT_MS });
  }
  return thingdexCache;
};

export const getPrinthubSdk = () => {
  const { printerHubBaseUrl } = getRuntimeConfig();
  if (!printhubCache || printhubCacheBaseUrl !== printerHubBaseUrl) {
    printhubCacheBaseUrl = printerHubBaseUrl;
    printhubCache = createPrinthubSdk({ baseUrl: printerHubBaseUrl, timeoutMs: REQUEST_TIMEOUT_MS });
  }
  return printhubCache;
};

export const getLabelServiceSdk = () => {
  const { labelServiceBaseUrl } = getRuntimeConfig();
  if (!labelServiceCache || labelServiceCacheBaseUrl !== labelServiceBaseUrl) {
    labelServiceCacheBaseUrl = labelServiceBaseUrl;
    labelServiceCache = createPrinthubSdk({ baseUrl: labelServiceBaseUrl, timeoutMs: REQUEST_TIMEOUT_MS });
  }
  return labelServiceCache;
};
