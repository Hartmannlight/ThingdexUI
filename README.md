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

## Complete Docker demo stack

The repository-level `docker-compose.yml` starts the complete local test system:

- PostgreSQL 15
- Thingdex API with automatic Alembic migrations
- PrintHub/ZPLGrid
- ZPL-II Printer Emulator
- idempotent demo-data seed job
- the production ThingdexUI image behind nginx

The Compose file expects the sibling repositories `Thingdex`, `PrintHub-ZPL-ll`,
and `ZPL-II-Printer-Emulator` next to this checkout, matching the workspace layout.

Start everything with one command:

```shell
docker compose up --build -d
```

The UI waits for the API, PrintHub, and seed job before it becomes healthy.
Open the services after startup:

| Service | URL |
| --- | --- |
| ThingdexUI | http://localhost:5173 |
| Thingdex API docs | http://localhost:8000/docs |
| PrintHub API docs | http://localhost:8001/docs |
| Virtual ZPL printer | http://localhost:9191 |
| PostgreSQL | `localhost:5433` |

Inspect the generated scan IDs and seed summary:

```shell
docker compose logs seed
```

The seed job is idempotent. It creates nested rooms, shelves and boxes, five
schema-driven item types, representative items, relations, property history,
a snapshot, two label templates, and one sample label sent to the emulator.

Re-run only the seed job:

```shell
docker compose run --rm seed
```

Stop the stack while retaining data:

```shell
docker compose down
```

Reset PostgreSQL and PrintHub templates, then recreate the complete demo:

```shell
docker compose down -v
docker compose up --build -d
```

Ports and the development-only database password can be overridden with:

- `THINGDEX_WEB_PORT` (default `5173`)
- `THINGDEX_API_PORT` (default `8000`)
- `PRINTHUB_PORT` (default `8001`)
- `ZPL_EMULATOR_WEB_PORT` (default `9191`)
- `ZPL_EMULATOR_TCP_PORT` (default `9102`)
- `THINGDEX_POSTGRES_PORT` (default `5433`)
- `THINGDEX_DB_PASSWORD` (default `thingdex-dev-only`)

The UI container generates `/config.js` and the nginx proxy configuration from
runtime environment variables; no browser-facing API hostname is baked into the image.

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
