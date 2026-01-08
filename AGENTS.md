# Thingdex UI - Agent Notes

Short context for future work on this repo.

## Project summary
- Scanner-first React + Vite UI for Thingdex inventory backend.
- Focus: rapid data entry, clear location containment, and dedicated scanner workflows.
- Label printing integrates with external label/printer services via runtime config.

## Key folders
- `src/app`: router + layout (`Shell`, `routes.tsx`).
- `src/features`: pages and workflows (items, locations, relations, labels, search).
- `src/api`: typed API clients and runtime config glue.
- `public/config.js` / `public/config.template.js`: runtime config injected at build/runtime.

## Runtime config (see `public/config.template.js`)
- `THINGDEX_API_BASE_URL`
- `THINGDEX_LABEL_SERVICE_BASE_URL`
- `THINGDEX_PRINTER_HUB_BASE_URL`
- `THINGDEX_ROOT_LOCATION_ID` (optional; UI bootstraps from `/v1/locations/root`)
- `THINGDEX_FEATURE_*` flags
- `THINGDEX_AUDIO_*`

## Routes / pages (high level)
- Daily Ops: Create Items, Move Item, Move Location, Attach/Detach/Update Relation, Reprint Label.
- Containers: Overview, Locations.
- Items: Search + UUID Lookup.
- Create Tools hub: `Create Items`, `Create Location`, `Create Item Type`, `Create Snapshot`.
- Edit Tools hub: `Update Item`, `Update Item Props`, `Update Location`, `Item History`, `Item Snapshots`, `Item Type Editor`.

## Label printing details
- Reprint: `POST /v1/labels/print` with `item_id` or `location_id`.
- Location reprint requires `location.meta.label_template_id`.
- Location create UI lets users set `meta.label_template_id` and optionally print on create.

## Dev commands
- `npm run gen:api` to regenerate OpenAPI types.
- `npm run dev` for local Vite dev server.
- `docker compose up --build` for containerized run.

## Gotchas
- Scanner flows rely on Enter key auto-advance and focus selection.
- Help tooltips should explain purpose/effect, not just restate labels.
