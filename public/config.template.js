window.__THINGDEX_CONFIG__ = {
  apiBaseUrl: "${THINGDEX_API_BASE_URL}",
  labelServiceBaseUrl: "${THINGDEX_LABEL_SERVICE_BASE_URL}",
  printerHubBaseUrl: "${THINGDEX_PRINTER_HUB_BASE_URL}",
  rootLocationId: "${THINGDEX_ROOT_LOCATION_ID}",
  defaults: {
    includeDescendants: "${THINGDEX_DEFAULT_INCLUDE_DESCENDANTS}"
  },
  featureFlags: {
    inventory: "${THINGDEX_FEATURE_INVENTORY}",
    itemTypes: "${THINGDEX_FEATURE_ITEM_TYPES}",
    createItems: "${THINGDEX_FEATURE_CREATE_ITEMS}",
    moveWorkflow: "${THINGDEX_FEATURE_MOVE}",
    search: "${THINGDEX_FEATURE_SEARCH}",
    snapshots: "${THINGDEX_FEATURE_SNAPSHOTS}",
    audioFeedback: "${THINGDEX_FEATURE_AUDIO}",
    labelPrinting: "${THINGDEX_FEATURE_LABEL_PRINTING}"
  },
  audio: {
    enabled: "${THINGDEX_AUDIO_ENABLED}",
    volume: "${THINGDEX_AUDIO_VOLUME}"
  }
};
