export type FeatureFlags = {
  inventory: boolean;
  itemTypes: boolean;
  createItems: boolean;
  moveWorkflow: boolean;
  search: boolean;
  snapshots: boolean;
  audioFeedback: boolean;
  labelPrinting: boolean;
};

export type AppConfig = {
  apiBaseUrl: string;
  labelServiceBaseUrl: string;
  printerHubBaseUrl: string;
  rootLocationId: string | null;
  defaults: {
    includeDescendants: boolean;
  };
  featureFlags: FeatureFlags;
  audio: {
    enabled: boolean;
    volume: number;
  };
};

const truthy = new Set(["1", "true", "yes", "on"]);
const falsy = new Set(["0", "false", "no", "off"]);

const isPlaceholder = (value?: string) =>
  !!value && value.includes("${") && value.includes("}");

const readBool = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (truthy.has(normalized)) return true;
    if (falsy.has(normalized)) return false;
  }
  return fallback;
};

const readNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const readString = (value: unknown, fallback: string) => {
  if (typeof value === "string" && value.trim().length > 0 && !isPlaceholder(value)) {
    return value.trim();
  }
  return fallback;
};

const buildConfig = (): AppConfig => {
  const runtime = typeof window !== "undefined" ? window.__THINGDEX_CONFIG__ : undefined;
  const localRoot = typeof window !== "undefined" ? window.localStorage.getItem("thingdex.rootLocationId") : null;

  const defaultConfig: AppConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
    labelServiceBaseUrl: import.meta.env.VITE_LABEL_SERVICE_BASE_URL ?? "/ext/label",
    printerHubBaseUrl: import.meta.env.VITE_PRINTER_HUB_BASE_URL ?? "/ext/printhub",
    rootLocationId: import.meta.env.VITE_ROOT_LOCATION_ID ?? localRoot,
    defaults: {
      includeDescendants: readBool(import.meta.env.VITE_DEFAULT_INCLUDE_DESCENDANTS, true)
    },
    featureFlags: {
      inventory: readBool(import.meta.env.VITE_FEATURE_INVENTORY, true),
      itemTypes: readBool(import.meta.env.VITE_FEATURE_ITEM_TYPES, true),
      createItems: readBool(import.meta.env.VITE_FEATURE_CREATE_ITEMS, true),
      moveWorkflow: readBool(import.meta.env.VITE_FEATURE_MOVE, true),
      search: readBool(import.meta.env.VITE_FEATURE_SEARCH, true),
      snapshots: readBool(import.meta.env.VITE_FEATURE_SNAPSHOTS, false),
      audioFeedback: readBool(import.meta.env.VITE_FEATURE_AUDIO, true),
      labelPrinting: readBool(import.meta.env.VITE_FEATURE_LABEL_PRINTING, true)
    },
    audio: {
      enabled: readBool(import.meta.env.VITE_AUDIO_ENABLED, true),
      volume: readNumber(import.meta.env.VITE_AUDIO_VOLUME, 0.2)
    }
  };

  return {
    apiBaseUrl: readString(runtime?.apiBaseUrl, defaultConfig.apiBaseUrl),
    labelServiceBaseUrl: readString(runtime?.labelServiceBaseUrl, defaultConfig.labelServiceBaseUrl),
    printerHubBaseUrl: readString(runtime?.printerHubBaseUrl, defaultConfig.printerHubBaseUrl),
    rootLocationId: readString(runtime?.rootLocationId, defaultConfig.rootLocationId ?? "") || null,
    defaults: {
      includeDescendants: readBool(runtime?.defaults?.includeDescendants, defaultConfig.defaults.includeDescendants)
    },
    featureFlags: {
      inventory: readBool(runtime?.featureFlags?.inventory, defaultConfig.featureFlags.inventory),
      itemTypes: readBool(runtime?.featureFlags?.itemTypes, defaultConfig.featureFlags.itemTypes),
      createItems: readBool(runtime?.featureFlags?.createItems, defaultConfig.featureFlags.createItems),
      moveWorkflow: readBool(runtime?.featureFlags?.moveWorkflow, defaultConfig.featureFlags.moveWorkflow),
      search: readBool(runtime?.featureFlags?.search, defaultConfig.featureFlags.search),
      snapshots: readBool(runtime?.featureFlags?.snapshots, defaultConfig.featureFlags.snapshots),
      audioFeedback: readBool(runtime?.featureFlags?.audioFeedback, defaultConfig.featureFlags.audioFeedback),
      labelPrinting: readBool(runtime?.featureFlags?.labelPrinting, defaultConfig.featureFlags.labelPrinting)
    },
    audio: {
      enabled: readBool(runtime?.audio?.enabled, defaultConfig.audio.enabled),
      volume: readNumber(runtime?.audio?.volume, defaultConfig.audio.volume)
    }
  };
};

export const getRuntimeConfig = () => buildConfig();
