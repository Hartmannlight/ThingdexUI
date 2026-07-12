import { createThingdexSdk } from "@thingdex/sdk";

import { getRuntimeConfig } from "@/config/runtime";

const REQUEST_TIMEOUT_MS = 15000;

let thingdexCache: ReturnType<typeof createThingdexSdk> | null = null;
let thingdexCacheBaseUrl = "";

export const getThingdexSdk = () => {
  const { apiBaseUrl } = getRuntimeConfig();
  if (!thingdexCache || thingdexCacheBaseUrl !== apiBaseUrl) {
    thingdexCacheBaseUrl = apiBaseUrl;
    thingdexCache = createThingdexSdk({ baseUrl: apiBaseUrl, timeoutMs: REQUEST_TIMEOUT_MS });
  }
  return thingdexCache;
};
