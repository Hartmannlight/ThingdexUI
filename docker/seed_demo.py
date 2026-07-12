"""Idempotently seed a local Thingdex demo stack through its public APIs."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any


THINGDEX = os.getenv("THINGDEX_API_URL", "http://api:8000").rstrip("/")
PRINTHUB = os.getenv("PRINTHUB_API_URL", "http://printhub:8000").rstrip("/")
PRINTER_ID = os.getenv("DEMO_PRINTER_ID", "virtual-zpl-demo")


def request(base: str, path: str, method: str = "GET", payload: Any | None = None) -> Any:
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{base}{path}",
        data=body,
        method=method,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} failed ({exc.code}): {detail}") from exc


def wait_for(base: str, path: str) -> None:
    for attempt in range(60):
        try:
            request(base, path)
            return
        except Exception as exc:  # noqa: BLE001 - startup retry with final error.
            if attempt == 59:
                raise RuntimeError(f"Service did not become ready: {base}{path}") from exc
            time.sleep(2)


def template_payload(name: str, variables: list[dict[str, str]], text: str, sample: dict[str, str]) -> dict[str, Any]:
    return {
        "name": name,
        "tags": ["thingdex", "demo", "50x25"],
        "variables": variables,
        "template": {
            "schema_version": 1,
            "name": name.lower().replace(" ", "_"),
            "defaults": {
                "leaf_padding_mm": [1.4, 1.4, 1.4, 1.4],
                "text": {"font_height_mm": 3.8, "wrap": "word", "fit": "shrink_to_fit", "max_lines": 4},
                "code2d": {"quiet_zone_mm": 1.0},
                "render": {"missing_variables": "error", "emit_ci28": True},
            },
            "layout": {
                "kind": "split",
                "direction": "v",
                "ratio": 0.36,
                "gutter_mm": 1.0,
                "children": [
                    {"kind": "leaf", "alias": "code", "elements": [{"type": "qr", "data": "{internal_uuid}", "magnification": 3}]},
                    {"kind": "leaf", "alias": "text", "elements": [{"type": "text", "text": text, "align_v": "center"}]},
                ],
            },
        },
        "sample_data": sample,
        "preview_target": {"width_mm": 50, "height_mm": 25, "dpi": 203, "origin_x_mm": 0, "origin_y_mm": 0},
    }


def ensure_template(name: str, payload: dict[str, Any]) -> str:
    entries = request(PRINTHUB, "/v1/templates")
    existing = next((entry for entry in entries if entry.get("name") == name), None)
    if existing:
        return existing["id"]
    created = request(PRINTHUB, "/v1/templates", "POST", payload)
    print(f"Created label template: {created['id']}")
    return created["id"]


def unwrap(response: dict[str, Any]) -> dict[str, Any]:
    return response.get("data", response)


def flatten_locations(node: dict[str, Any]) -> list[dict[str, Any]]:
    return [node, *[item for child in node.get("children", []) for item in flatten_locations(child)]]


def ensure_location(parent: dict[str, Any], name: str, kind: str, template_id: str) -> dict[str, Any]:
    tree = request(THINGDEX, "/v1/locations/tree")
    existing = next(
        (location for location in flatten_locations(tree) if location.get("parent_id") == parent["id"] and location.get("name") == name),
        None,
    )
    if existing:
        return existing
    response = request(
        THINGDEX,
        "/v1/locations",
        "POST",
        {"name": name, "parent_id": parent["id"], "kind": kind, "meta": {"label_template_id": template_id, "demo": True}},
    )
    created = unwrap(response)
    print(f"Created location: {name} ({created['id']})")
    return created


def field(field_type: str, label: str, *, required: bool = False, **extra: Any) -> dict[str, Any]:
    return {"type": field_type, "label": label, "required": required, **extra}


def ensure_type(name: str, fields: dict[str, Any], template_id: str) -> dict[str, Any]:
    entries = request(THINGDEX, "/v1/item-types")
    existing = next((entry for entry in entries if entry.get("name") == name), None)
    if existing:
        return existing
    created = request(
        THINGDEX,
        "/v1/item-types",
        "POST",
        {"name": name, "schema": {"fields": fields}, "ui": {"display_field": "name"}, "label_template_id": template_id},
    )
    print(f"Created item type: {name} ({created['id']})")
    return created


def ensure_item(key: str, type_name: str, location: dict[str, Any], description: str, props: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    items = request(THINGDEX, "/v1/items?limit=1000")
    existing = next(
        (item for item in items if item.get("description") == description and (item.get("props") or {}).get("name") == props.get("name")),
        None,
    )
    if existing:
        return existing, False
    response = request(
        THINGDEX,
        "/v1/items",
        "POST",
        {"type": type_name, "location_id": location["id"], "status": "stored", "description": description, "props": props},
    )
    created = unwrap(response)
    print(f"Created item: {description} [{key}] ({created['id']})")
    return created, True


def ensure_relation(parent: dict[str, Any], child: dict[str, Any], relation_type: str, **metadata: Any) -> None:
    relations = request(THINGDEX, f"/v1/items/{parent['id']}/relations/children?active_only=true")
    if any(relation.get("child_item_id") == child["id"] and relation.get("relation_type") == relation_type for relation in relations):
        return
    request(
        THINGDEX,
        f"/v1/items/{parent['id']}/relations",
        "POST",
        {"child_item_id": child["id"], "relation_type": relation_type, **metadata},
    )
    print(f"Created relation: {parent['id']} -> {child['id']} ({relation_type})")


def main() -> None:
    wait_for(PRINTHUB, "/health")
    wait_for(THINGDEX, "/health/ready")

    item_template_id = ensure_template(
        "Thingdex Demo Item",
        template_payload(
            "Thingdex Demo Item",
            [{"name": "name", "label": "Name", "mode": "required"}, {"name": "internal_uuid", "label": "UUID", "mode": "required"}],
            "{name}\nThingdex Demo",
            {"name": "USB-C-Kabel, 2 m", "internal_uuid": "00000000-0000-0000-0000-000000000001"},
        ),
    )
    location_template_id = ensure_template(
        "Thingdex Demo Location",
        template_payload(
            "Thingdex Demo Location",
            [
                {"name": "container_name", "label": "Lagerort", "mode": "required"},
                {"name": "location_uuid", "label": "Location UUID", "mode": "required"},
                {"name": "internal_uuid", "label": "UUID", "mode": "required"},
            ],
            "{container_name}\nLagerort",
            {
                "container_name": "Box Kabel",
                "location_uuid": "00000000-0000-0000-0000-000000000002",
                "internal_uuid": "00000000-0000-0000-0000-000000000002",
            },
        ),
    )

    root = request(THINGDEX, "/v1/locations/root")
    keller = ensure_location(root, "Keller", "room", location_template_id)
    arbeitszimmer = ensure_location(root, "Arbeitszimmer", "room", location_template_id)
    werkstatt = ensure_location(root, "Werkstatt", "room", location_template_id)
    regal_a = ensure_location(keller, "Regal A", "shelf", location_template_id)
    box_kabel = ensure_location(regal_a, "Box Kabel & Adapter", "box", location_template_id)
    box_schrauben = ensure_location(regal_a, "Box Schrauben", "box", location_template_id)
    schrank = ensure_location(arbeitszimmer, "Schrank", "cabinet", location_template_id)
    werkbank = ensure_location(werkstatt, "Werkbank", "bench", location_template_id)

    ensure_type(
        "kabel",
        {
            "name": field("string", "Bezeichnung", required=True, track_history=False, order=10),
            "connector_a": field("string", "Stecker A", required=True, enum=["USB-C", "USB-A", "HDMI", "Schuko"], order=20),
            "connector_b": field("string", "Stecker B", required=True, enum=["USB-C", "USB-A", "HDMI", "Euro", "Schuko"], order=30),
            "length_m": field("number", "Länge", required=True, min=0.1, unit="m", order=40),
            "category": field("string", "Kategorie", enum=["Daten", "Strom", "Audio/Video"], order=50),
        },
        item_template_id,
    )
    ensure_type(
        "werkzeug",
        {
            "name": field("string", "Bezeichnung", required=True, order=10),
            "manufacturer": field("string", "Hersteller", order=20),
            "model": field("string", "Modell", order=30),
            "condition": field("string", "Zustand", required=True, enum=["neu", "gut", "gebraucht", "defekt"], order=40),
        },
        item_template_id,
    )
    ensure_type(
        "verbrauchsmaterial",
        {
            "name": field("string", "Bezeichnung", required=True, order=10),
            "count": field("integer", "Bestand", required=True, min=0, track_history=True, order=20),
            "unit": field("string", "Einheit", required=True, enum=["Stück", "Packung", "Meter"], order=30),
            "reorder_at": field("integer", "Nachbestellen ab", min=0, order=40),
        },
        item_template_id,
    )
    ensure_type(
        "computer",
        {
            "name": field("string", "Bezeichnung", required=True, order=10),
            "hostname": field("string", "Hostname", required=True, order=20),
            "os": field("string", "Betriebssystem", order=30),
            "ram_gb": field("integer", "Arbeitsspeicher", min=1, unit="GB", order=40),
        },
        item_template_id,
    )
    ensure_type(
        "komponente",
        {
            "name": field("string", "Bezeichnung", required=True, order=10),
            "manufacturer": field("string", "Hersteller", order=20),
            "capacity_gb": field("integer", "Kapazität", min=1, unit="GB", order=30),
            "serial": field("string", "Seriennummer", order=40),
        },
        item_template_id,
    )

    pc, pc_created = ensure_item("pc-workstation", "computer", arbeitszimmer, "Arbeitsplatz-PC", {"name": "Arbeitsplatz-PC", "hostname": "thingdesk", "os": "Linux", "ram_gb": 32})
    ssd, _ = ensure_item("ssd-workstation", "komponente", schrank, "NVMe SSD, 1 TB", {"name": "NVMe SSD, 1 TB", "manufacturer": "Samsung", "capacity_gb": 1000, "serial": "DEMO-NVME-001"})
    usb_c, usb_created = ensure_item("cable-usbc-2m", "kabel", box_kabel, "USB-C-Kabel, 2 m", {"name": "USB-C-Kabel, 2 m", "connector_a": "USB-C", "connector_b": "USB-C", "length_m": 2, "category": "Daten"})
    hdmi, _ = ensure_item("cable-hdmi-3m", "kabel", box_kabel, "HDMI-Kabel, 3 m", {"name": "HDMI-Kabel, 3 m", "connector_a": "HDMI", "connector_b": "HDMI", "length_m": 3, "category": "Audio/Video"})
    extension, _ = ensure_item("cable-power-5m", "kabel", werkbank, "Verlängerungskabel, 5 m", {"name": "Verlängerungskabel, 5 m", "connector_a": "Schuko", "connector_b": "Schuko", "length_m": 5, "category": "Strom"})
    cutter, _ = ensure_item("tool-cutter", "werkzeug", werkbank, "Seitenschneider", {"name": "Seitenschneider", "manufacturer": "Knipex", "model": "70 02 160", "condition": "gut"})
    soldering, _ = ensure_item("tool-soldering", "werkzeug", werkbank, "Lötkolben 60 W", {"name": "Lötkolben 60 W", "manufacturer": "Weller", "model": "Demo 60", "condition": "gebraucht"})
    multimeter, _ = ensure_item("tool-multimeter", "werkzeug", schrank, "Digitalmultimeter", {"name": "Digitalmultimeter", "manufacturer": "Brymen", "model": "BM235", "condition": "gut"})
    screws, screws_created = ensure_item("stock-m4-screws", "verbrauchsmaterial", box_schrauben, "M4-Schrauben", {"name": "M4-Schrauben", "count": 120, "unit": "Stück", "reorder_at": 30})
    ties, _ = ensure_item("stock-cable-ties", "verbrauchsmaterial", box_schrauben, "Kabelbinder, schwarz", {"name": "Kabelbinder, schwarz", "count": 80, "unit": "Stück", "reorder_at": 20})
    batteries, _ = ensure_item("stock-aa-batteries", "verbrauchsmaterial", schrank, "AA-Batterien", {"name": "AA-Batterien", "count": 24, "unit": "Stück", "reorder_at": 8})

    ensure_relation(pc, ssd, "installed_in", quantity=1, slot="M.2_1", notes="Demo-Komponente im Arbeitsplatz-PC")
    ensure_relation(multimeter, usb_c, "paired_with", quantity=1, notes="Demo-Zubehör")

    if screws_created:
        request(THINGDEX, f"/v1/items/{screws['id']}/props", "PATCH", {"props": {"count": 118}, "source": "demo-seed"})
        print("Created property history for M4-Schrauben: 120 -> 118")

    snapshots = request(THINGDEX, f"/v1/items/{pc['id']}/snapshots?kind=system-info")
    if not snapshots:
        request(
            THINGDEX,
            f"/v1/items/{pc['id']}/snapshots",
            "POST",
            {"kind": "system-info", "data": {"hostname": "thingdesk", "kernel": "6.12-demo", "disks": ["nvme0n1"]}, "meta": {"source": "demo-seed"}},
        )
        print("Created system-info snapshot for Arbeitsplatz-PC")

    if pc_created or usb_created:
        try:
            result = request(
                THINGDEX,
                "/v1/labels/print",
                "POST",
                {"printer_id": PRINTER_ID, "item_id": usb_c["id"], "return_preview": False},
            )
            print(f"Sent demo label to emulator: {result.get('bytes_sent', 0)} bytes")
        except Exception as exc:  # noqa: BLE001 - data seeding must survive an optional render failure.
            print(f"Demo label could not be sent: {exc}", file=sys.stderr)

    print("\nThingdex demo data is ready.")
    print(f"Root location: {root['id']}")
    print(f"Scan example item (USB-C cable): {usb_c['id']}")
    print(f"Scan example target (Werkbank): {werkbank['id']}")
    print(f"Printer: {PRINTER_ID}")


if __name__ == "__main__":
    main()
