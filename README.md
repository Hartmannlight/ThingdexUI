# Thingdex UI

Scanner-first frontend for the Thingdex inventory API.

Key goals:
- Rapid barcode-driven data entry with strong keyboard flow.
- Clear location containment and item relations.
- Dedicated scanner workflows for move/attach/detach/label reprint.

## Local development

1) Install deps
```
npm install
```

2) Generate API types (optional but recommended)
```
npm run gen:api
```

3) Run the dev server
```
npm run dev
```

### Dev config

To avoid CORS locally, use the Vite proxy by setting:
```
VITE_API_BASE_URL=/api
```
Vite will proxy `/api/*` to `http://127.0.0.1:8000`.

Use a `.env` file (see `.env.example`) or edit `public/config.js` for defaults.

## Docker

Build and run the UI:
```
docker compose up --build
```

Configuration lives in `docker-compose.yml` under `environment`:
- `THINGDEX_API_BASE_URL`
- `THINGDEX_API_UPSTREAM`
- `THINGDEX_LABEL_SERVICE_BASE_URL`
- `THINGDEX_PRINTER_HUB_BASE_URL`
- `THINGDEX_ROOT_LOCATION_ID`
- `THINGDEX_DEFAULT_INCLUDE_DESCENDANTS`
- `THINGDEX_FEATURE_*` flags
- `THINGDEX_AUDIO_*`

The container generates `/config.js` at runtime from those variables.

## Root bootstrap

The UI auto-bootstraps the root location by calling `GET /v1/locations/root`.
No manual `THINGDEX_ROOT_LOCATION_ID` is needed on first start.

## Navigation overview

- Daily Ops: Create Items, Move Item, Move Location, Attach/Detach/Update Relation, Reprint Label
- Containers: Overview, Locations
- Items: Search + UUID Lookup
- Create: Create Tools (hub for infrequent create flows)
- Edit: Edit Tools (hub for update/history/snapshots)

## Label printing notes

- Reprint uses `POST /v1/labels/print` with `item_id` or `location_id`.
- Location reprint requires `location.meta.label_template_id` to be set (create/update the location with a label template).
