interface Window {
  __THINGDEX_CONFIG__?: {
    apiBaseUrl?: string;
    labelServiceBaseUrl?: string;
    printerHubBaseUrl?: string;
    rootLocationId?: string;
    defaults?: {
      includeDescendants?: boolean | string;
    };
    featureFlags?: Record<string, boolean | string | undefined>;
    audio?: {
      enabled?: boolean | string;
      volume?: number | string;
    };
  };
}
