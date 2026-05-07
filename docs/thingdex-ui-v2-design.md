# ThingdexUI v2 Design- und Architekturkonzept

Status: Arbeitsdokument fuer die scanner-first Neuentwicklung  
Branch: `thingdex-ui-v2-scanner-first`  
Primaere App: `ThingdexUI`  
Primaerer Dev-Stack: `Thingdex-Home-Inventory/docker-compose.dev.yml`

## Kurzfassung

ThingdexUI v2 ist kein klassisches Admin-Frontend. Die Anwendung ist ein Inventar-Terminal fuer reale Werkstatt-, Lager- und Haushaltsablaeufe, bei denen ein Mensch mit einem Handscanner vor einem Regal steht. Die wichtigste Interaktion ist nicht das Klicken durch Menues, sondern:

```text
Item scannen -> Item anzeigen -> Ort scannen -> Item verschieben
```

Jede Scanner-Ansicht muss drei Fragen beantworten:

```text
1. Was wurde erkannt?
2. Wo befindet es sich?
3. Was passiert beim naechsten Scan?
```

Diese drei Fragen sind die fachliche Mitte der UI. Alles andere ist nachgeordnet.

## Produktidee

Thingdex verwaltet physische Dinge und Orte. Die UI soll sich wie ein Terminal anfuehlen, nicht wie eine SaaS-Verwaltungsoberflaeche. Nutzer sollen damit arbeiten koennen, waehrend sie Kisten halten, an Regalen stehen oder eine Serie von Items erfassen.

Daraus folgen diese Grundsaetze:

- Scanner-Eingabe ist immer prominent und standardmaessig fokussiert.
- Hauptaktionen sind gross, touch-tauglich und eindeutig.
- Statusinformationen sind stationbezogen, nicht benutzerbezogen.
- Gefaehrliche Modi sind explizit sichtbar.
- Die Navigation folgt Arbeitsablaeufen, nicht API-Ressourcen.
- Die UI erklaert konsequent den naechsten Scan.

Die Anwendung ist fuer wiederholte operative Arbeit gebaut. Sie soll ruhig, robust und direkt sein.

## Nicht-Ziele

ThingdexUI v2 soll bewusst nicht diese Dinge sein:

- keine klassische Admin-Webapp mit dichter Tabellenverwaltung als Startpunkt
- kein Multi-User-SaaS-Produkt mit Profil, Logout, Rollen oder Account-Menue
- kein Dashboard als Startseite
- keine API-nahe Hauptnavigation wie `Items`, `Locations`, `Relations`, `Labels`
- keine Maus-first Oberflaeche
- keine Ansicht, die Scannerfokus durch normale Klicks dauerhaft verliert
- keine dekorative Marketingseite

Admin-Funktionen existieren, aber sie sind seltene Strukturarbeit. Der Alltag findet in `Scannen`, `Orte`, `Inventar`, `Eingang` und `Wartung` statt.

## Grundprinzipien

### 1. Scanner First

Die Scanner-Eingabe ist global sichtbar und soll nach jeder Aktion wieder fokussiert werden. Der Nutzer darf nach einem Scan nicht gezwungen sein, die Eingabe neu anzuklicken. Das ist wichtiger als klassische Formularergonomie.

Konsequenzen:

- `TopBar` enthaelt das Scannerfeld.
- Scans werden zentral in `ScannerProvider` verarbeitet.
- Seiten reagieren auf das letzte Scan-Event.
- Klicks in der Shell sollen den Scannerfokus wiederherstellen.
- Scannerlogik gehoert nicht in beliebige Formularfelder.

### 2. Kontext Vor Aktion

Ein Scan fuehrt zuerst zu Verstehen, nicht sofort zu veraendernden Aktionen, ausser die State-Machine erlaubt es eindeutig.

Beispiel:

```text
Kein Kontext + Item
-> Item anzeigen

Item-Kontext + Ort
-> Item verschieben
```

Die UI zeigt vor dem naechsten Scan an, welche Aktion daraus folgt.

### 3. Gefaehrliche Abkuerzungen Sind Opt-in

Ein Ort-Kontext plus Item-Scan verschiebt ein Item nicht automatisch. Das waere zu gefaehrlich, weil ein Nutzer einen Ort anschauen kann und danach nur ein Item pruefen moechte.

Automatisches Verschieben vieler Items ist nur im Bulk-Modus sinnvoll und muss sichtbar sein:

```text
Bulk-Modus aktiv
Zielort: Keller / Regal 2 / Kiste B
```

Bei Auto-Move:

```text
AUTO-MOVE AKTIV
Alle gescannten Items werden sofort verschoben.
```

### 4. Use-Case-Navigation

Die Navigation muss die Sprache der realen Arbeit sprechen:

```text
Scannen
Orte
Inventar
Eingang
Wartung
Verwaltung
System
```

Nicht:

```text
Items
Locations
Relations
Labels
Item Types
```

API-Ressourcen bleiben intern in API-Modulen. Die UI organisiert sich nach Aufgaben.

### 5. Terminal Statt Benutzerkonto

Aktuell gibt es keine Authentifizierung und keine Benutzer. Deshalb zeigt die UI keine Personenidentitaet.

Richtig:

```text
Station: Werkstatt
Scanner: aktiv
API: online
Drucker: virtual-zpl-dev
```

Falsch:

```text
Thomas
Administrator
Profil
Logout
```

Die App repraesentiert eine Station, nicht eine Person.

### 6. Touch Als Gleichwertiger Bedienmodus

Touch ist nicht nur responsives Layout. Touch bedeutet:

- Hauptaktionen mindestens 48px hoch, besser 56-72px.
- Action Tiles statt kleiner Textlinks.
- Karten statt dichter Tabellen.
- Keine Hover-only Interaktionen.
- Grosse Trefferflaechen fuer operative Aktionen.
- Formulare mit klaren, groben Gruppen.

### 7. Klarheit Vor Dichte

Thingdex kann fachlich komplex werden: Orte, Unterorte, Relations, Snapshots, History, Schemas, Labels. Die scanner-first UI darf diese Komplexitaet nicht gleichzeitig auf die Startseite kippen.

Die Startseite zeigt:

```text
1. Gescannter Kontext
2. Naechster Scan
3. Grosse Aktionen
4. Letzte Aktion
```

Details, Relations und History sind erreichbar, aber nicht der erste Blick.

## Visuelles Konzept

Das Layout orientiert sich am akzeptierten Mockup:

```text
Sidebar | Topbar mit Scannerfeld und Systemstatus
Sidebar | Hauptinhalt
Sidebar | Kontextkarte
Sidebar | Naechster Scan
Sidebar | Aktionen
Sidebar | Letzte Aktion
```

Die visuelle Sprache ist ruhig, hell und funktional:

- weisser Arbeitsbereich auf hellem Hintergrund
- klare Panel-Grenzen
- blaue Primaerfarbe fuer Scanner- und Systemfokus
- kleine Radien, keine verspielten Kartenstapel
- grosse Buttons und Kacheln
- Status-Badges mit eindeutiger Farbe
- keine Benutzer-Avatare
- keine Marketing-Heroes
- keine dekorativen Orbs, Bokeh oder ueberladene Farbverlaeufe

Das UI soll in einer Werkstatt nicht fragil wirken. Es darf modern aussehen, aber nicht wie ein Landingpage-Template.

### Sidebar

Die Sidebar ist persistent und bewusst knapp:

```text
thingdex

[ Scannen ]
[ Orte ]
[ Inventar ]
[ Eingang ]

---

[ Wartung ]
[ Verwaltung ]
[ System ]

Station:
Werkstatt
Drucker: virtual-zpl-dev
```

Die Station Card ist fachlich wichtig, weil sie zeigt, welche physische Arbeitsstation gerade benutzt wird.

### Topbar

Die Topbar enthaelt:

```text
[ Scannen oder suchen ... ] [ Scanner: aktiv ] [ API: online ]
```

Das Scannerfeld ist das wichtigste interaktive Element der gesamten App. Systemstatus ist rechts sichtbar, aber nicht dominant.

### Kontextkarte

Die Kontextkarte beantwortet: Was wurde erkannt?

Item-Beispiel:

```text
Gescanntes Item

USB-C Kabel 2m schwarz
Typ: Kabel
Status: aktiv
ID: ITEM-...
Ort: Keller / Regal 2 / Kiste A
```

Ort-Beispiel:

```text
Gescannter Ort

Kiste B
Pfad: Keller / Regal 2 / Kiste B
Direkte Items: 12
Unterorte: 3
ID: ...
```

### Next Scan Hint

Der Next Scan Hint ist kein Hilfetext, sondern ein zentrales Bedienelement. Er zeigt die aktuelle State-Machine-Regel in menschlicher Sprache.

Item-Kontext:

```text
Naechster Scan
Ort scannen  -> Item wird verschoben
Item scannen -> anderes Item oeffnen
```

Ort-Kontext:

```text
Naechster Scan
Item scannen -> Item oeffnen
Ort scannen  -> anderen Ort oeffnen
```

Bulk-Kontext:

```text
Naechster Scan
Item scannen -> zur Liste hinzufuegen
```

### Action Grid

Action Tiles sind grosse Touch-Flaechen. Sie sind Kontextaktionen, nicht Primaerworkflow-Ersatz. Der Hauptworkflow bleibt Scan-getrieben.

Beispiel Item:

```text
[ Verschieben ]       [ Label drucken ]   [ Bearbeiten ]
[ Inhalt anzeigen ]   [ Beziehungen ]     [ Verlauf ]
```

Beispiel Ort:

```text
[ Inhalt anzeigen ]       [ Items hierhin scannen ] [ Label drucken ]
[ Unterort anlegen ]      [ Ort verschieben ]       [ Bearbeiten ]
```

## Informationsarchitektur

Aktuelle v2-Routen:

```text
/                  -> Redirect nach /scan
/scan              -> Scanner-Startseite
/locations         -> Ortsbaum und Root/Default-Ort
/locations/:id     -> Ort-Detail
/items             -> Inventarsuche
/items/:id         -> Item-Detail
/intake            -> Eingang / neues Item
/maintenance       -> Wartungsarbeitsvorraete
/admin             -> Verwaltung / Item-Typen
/system            -> Stationszustand
```

Die alten administrativen Einzelrouten aus v1 sind nicht die v2-Hauptnavigation. Sie bleiben nicht der konzeptionelle Zielzustand.

### Menue: Scannen

Zweck:

- Item scannen
- Ort scannen
- Item automatisch durch Ort-Scan verschieben
- Bulk-Modus starten
- Label drucken
- letzte Aktion anzeigen

Die Scannen-Seite ist die eigentliche Startseite.

### Menue: Orte

Zweck:

- Ortsbaum anzeigen
- Ort oeffnen
- Inhalt anzeigen
- Unterorte anzeigen
- Unterort anlegen
- Ort verschieben
- Label drucken

Orte sind physische Container, nicht nur Stammdaten. Die UI sollte deshalb Begriffe wie "in Kiste legen" und "unter Ort verschieben" bevorzugen.

### Menue: Inventar

Zweck:

- Freitextsuche
- Typauswahl
- dynamische Filter aus Item-Type-Schema
- Ortfilter
- Statusfilter
- Bulk-Aktionen auf Suchergebnisse

Inventar ist die Such- und Filterzentrale. Es ist nicht die Startseite.

### Menue: Eingang

Zweck:

- neue Items erfassen
- Typ waehlen
- Startort setzen
- Eigenschaften erfassen
- optional direkt Label drucken

Eingang ist fuer Dinge, die neu ins System kommen. Das ist fachlich ein anderer Modus als Scannen.

### Menue: Wartung

Zweck:

- Arbeitsvorraete und Datenprobleme
- MVP: Items ohne Ort
- spaeter: defekte Items, fehlende Pflichtfelder, alte Snapshots, Relationsprobleme

Wartung ist operativ, nicht administrativ.

### Menue: Verwaltung

Zweck:

- Item-Typen
- Schemas
- UI-Hints
- Label-Templates
- Template-Validierung

Verwaltung ist seltene Strukturarbeit. Sie darf komplexer sein, aber gehoert nicht in den Tagesablauf.

### Menue: System

Zweck:

- API online/offline
- Scanner aktiv/inaktiv
- Drucker konfiguriert
- Root Location vorhanden
- Station Name
- Default Printer

System zeigt den Zustand der Station.

## Scanner-State-Machine

Die Scanlogik wird als State-Machine modelliert. Sie ist bewusst getrennt von einzelnen React-Komponenten.

Aktuelle Grundtypen:

```ts
type EntityKind = "item" | "location";

type ScanMode =
  | "idle"
  | "item_context"
  | "location_context"
  | "bulk_move"
  | "move_location";

interface ScanContext {
  mode: ScanMode;
  currentItemId?: string;
  currentLocationId?: string;
  targetLocationId?: string;
  bulkItemIds: string[];
  autoMove: boolean;
}
```

### Warum eine State-Machine?

Scanner-Interaktionen sind kontextsensitiv. Derselbe Scan kann je nach Zustand Unterschiedliches bedeuten:

```text
Ort gescannt ohne Kontext
-> Ort anzeigen

Ort gescannt bei offenem Item
-> Item dorthin verschieben

Ort gescannt im Ort-Kontext
-> anderen Ort anzeigen

Ort gescannt im Ort-verschieben-Modus
-> aktuellen Ort unter Zielort verschieben
```

Diese Regeln duerfen nicht als verstreute `if`-Statements in Seitenkomponenten wachsen. Die State-Machine macht sie testbar, erweiterbar und lesbar.

### Scan-Parser

Langfristig sollte jedes Label einen Prefix tragen:

```text
TDX:I:<uuid> = Item
TDX:L:<uuid> = Location
TDX:T:<uuid> = Item Type
```

Der Parser liefert:

```ts
type ParsedScan =
  | { kind: "item"; id: string; raw: string }
  | { kind: "location"; id: string; raw: string }
  | { kind: "item_type"; id: string; raw: string }
  | { kind: "unknown"; raw: string };
```

Bei alten UUID-only Labels muss die UI aktuell fallbacken:

```text
1. GET /v1/items/{id}
2. wenn nicht gefunden: GET /v1/locations/{id}
```

Langfristig waere ein Backend-Endpunkt sauberer:

```http
POST /v1/scan/resolve
```

### Entscheidungsregeln

Die State-Machine entscheidet fachlich, nicht visuell:

```text
idle + item
-> show_item

idle + location
-> show_location

item_context + location
-> move_item

item_context + item
-> show_item

location_context + item
-> show_item

location_context + location
-> show_location

bulk_move + item
-> bulk_add_item oder bulk_auto_move_item

move_location + location
-> move_location
```

Die UI uebersetzt Entscheidungen in API-Aufrufe, Toasts und neue Context Cards.

### Fehlerverhalten

Fehler muessen gross und handlungsorientiert sein:

```text
Item konnte nicht verschoben werden.
Grund: Zielort wurde nicht gefunden.
```

```text
Ort konnte nicht verschoben werden.
Moeglicher Grund: Ein Ort darf nicht in sich selbst oder einen Unterort verschoben werden.
```

Der Scannerfokus darf durch Fehler nicht dauerhaft verloren gehen.

## Bulk-Modus

Bulk ist wichtig, aber nicht Standard. Der Standard-Scanflow ist einzelnes Item plus Ort.

Bulk wird bewusst gestartet:

- Ort-Kontext -> `Items hierhin scannen`
- spaeter Inventar-Suche -> ausgewaehlte Items -> `Verschieben`
- spaeter Scannen-Menue -> `Bulk-Modus`

### Sicherer Modus

Default:

```text
Items werden gesammelt.
Nutzer bestaetigt mit "Alle verschieben".
```

Vorteile:

- Fehler sind sichtbarer.
- Nutzer kann Liste pruefen.
- Kein versehentliches sofortiges Verschieben.

### Auto-Move Modus

Optional:

```text
Jedes gescannte Item wird sofort in den Zielort verschoben.
```

Dieser Modus ist bewusst visuell scharf. Er darf nicht wie ein normaler Status aussehen.

## API-Architektur

Die UI nutzt API-Module als fachliche Grenze:

```text
src/api/
  client.ts
  items.ts
  locations.ts
  itemTypes.ts
  labels.ts
  labelPrint.ts
  relations.ts
  printers.ts
  system.ts
  types.ts
```

Regeln fuer API-Zugriff:

- Seiten importieren nicht direkt den SDK-Client.
- API-Module kapseln SDK-Details.
- Komponenten sollen keine HTTP-Pfade kennen.
- Runtime-Konfiguration kommt aus `config/runtime.ts`.
- Drucker- und Labeldienste laufen ueber Runtime-URLs/Proxies.

Wichtige API-Gruppen:

```http
GET /v1/items/{item_id}
PATCH /v1/items/{item_id}/move
POST /v1/items/search
POST /v1/items
PATCH /v1/items/bulk/move
GET /v1/items/missing-location
```

```http
GET /v1/locations/root
GET /v1/locations/tree
GET /v1/locations/{location_id}
GET /v1/locations/{location_id}/path
GET /v1/locations/{location_id}/children
GET /v1/locations/{location_id}/items
POST /v1/locations
PATCH /v1/locations/{location_id}
```

```http
POST /v1/labels/print
POST /v1/items/{item_id}/label/print
POST /v1/locations/{location_id}/label/print
```

```http
GET /health
GET /v1/locations/root
POST /v1/locations/root/bootstrap
```

## Frontend-Struktur

Zielstruktur:

```text
src/
  api/
  scanner/
  components/
    layout/
    scanner/
    entities/
    forms/
    lists/
    actions/
  pages/
  styles/
  utils/
```

### `src/scanner`

Scannerlogik und State-Machine:

```text
ScannerProvider.tsx
scanParser.ts
scanStateMachine.ts
types.ts
```

Diese Schicht soll moeglichst wenig UI-Abhaengigkeit haben.

### `src/components/layout`

Shell-Komponenten:

```text
AppShell
Sidebar
TopBar
```

Diese Komponenten definieren das Terminal-Gefuehl.

### `src/components/scanner`

Scanner-spezifische UI:

```text
NextScanHint
ModeBanner
LastActionBar
```

Diese Komponenten machen den Scannerzustand sichtbar.

### `src/components/actions`

Touch-Aktionsflaechen:

```text
ActionTile
```

Weitere Buttons sollten hier entstehen, wenn sie wiederverwendbar sind.

### `src/components/entities`

Darstellung von Domain-Objekten:

```text
ItemStatusBadge
LocationPathBreadcrumb
```

Spaeter sinnvoll:

```text
ItemCard
LocationCard
RelationCard
HistoryEntry
SnapshotCard
```

### `src/pages`

Use-Case-Seiten:

```text
ScanPage
LocationsPage
InventoryPage
ItemDetailPage
IntakePage
MaintenancePage
AdminPage
SystemPage
```

Seiten duerfen orchestrieren, aber wiederverwendbare Darstellung soll in Komponenten wandern, sobald sie mehrfach gebraucht wird.

## Komponentenprinzipien

### ActionTile

Action Tiles sind grosse, eindeutige Touch-Ziele.

Regeln:

- Mindestens 56px, meistens groesser.
- Titel plus kurze Wirkung.
- Icon/Marke links.
- Disabled-Zustand klar sichtbar.
- Keine verschachtelten Karten.

### Context Card

Context Cards sind fuer erkannte Entitaeten. Sie zeigen keine Listen von Moeglichkeiten, sondern den aktuellen fachlichen Kontext.

Regeln:

- Ein Kontext pro Karte.
- Titel gross genug fuer Distanzlesbarkeit.
- Ort/Pfad immer sichtbar, wenn vorhanden.
- Status als Badge.
- ID sichtbar, aber nicht dominanter als Name/Beschreibung.

### ModeBanner

ModeBanner zeigen Betriebsmodi, die die Scansemantik veraendern.

Beispiele:

- Bulk-Modus
- Auto-Move
- Ort-verschieben-Modus

Ein Modus, der Scanverhalten aendert, darf nicht nur in lokalem Buttonzustand versteckt sein.

### Listen

Touch-Listen bevorzugen Karten. Tabellen sind spaeter fuer Desktop moeglich, aber nicht die Standarddarstellung fuer operative Ansichten.

## Daten- und Zustandshaltung

### Server State

Server State laeuft ueber TanStack Query:

- Items
- Locations
- Item Types
- Relations
- History
- System Health

Nach Mutationen werden relevante Queries invalidiert.

### Scanner State

Scanner State ist UI-lokal:

- aktueller Scanmodus
- aktuelles Item
- aktueller Ort
- Bulk-Zielort
- Bulk-Liste
- Auto-Move-Schalter
- letzte Aktion

Scanner State ist kein Backend-State. Er beschreibt die momentane Arbeitsabsicht am Terminal.

### Runtime Config

Runtime-Konfiguration kommt aus:

```text
public/config.template.js
src/config/runtime.ts
Docker environment
Vite env
```

Wichtige Werte:

```text
THINGDEX_API_BASE_URL
THINGDEX_LABEL_SERVICE_BASE_URL
THINGDEX_PRINTER_HUB_BASE_URL
THINGDEX_DEFAULT_PRINTER_ID
THINGDEX_FEATURE_*
```

Im Docker-Dev-Stack ist der Standarddrucker:

```text
virtual-zpl-dev
```

## Dev-Stack

Der vollstaendige lokale Stack liegt in:

```text
Thingdex-Home-Inventory/docker-compose.dev.yml
```

Er startet:

```text
Postgres
Thingdex API
PrintHub API
ZPL-II Printer Emulator
Thingdex SDK Watcher
PrintHub SDK Watcher
ThingdexUI
LabelGallery
LabelArchitect
```

Wichtige URLs:

```text
ThingdexUI:               http://localhost:5173
Thingdex API:             http://localhost:8000/docs
PrintHub API:             http://localhost:8001/docs
ZPL-II Printer Emulator:  http://localhost:9191
LabelGallery:             http://localhost:5174
LabelArchitect:           http://localhost:5175
```

Der virtuelle Drucker ist in:

```text
Thingdex-Home-Inventory/dev/printhub-printers.yml
```

als `virtual-zpl-dev` konfiguriert. PrintHub sendet an:

```text
zpl-printer-emulator:9100
```

Die UI nutzt per Vite-Proxy:

```text
/api           -> thingdex-api:8000
/ext/printhub  -> printhub-api:8000/v1
/ext/label     -> printhub-api:8000/v1
```

## MVP-Schnitt

### Muss fuer v2 funktionieren

- Scanner-Startseite
- Item scannen -> anzeigen
- Ort scannen -> anzeigen
- Item offen + Ort scannen -> Item verschieben
- Ort oeffnen -> Inhalt anzeigen
- Bulk-Modus: Items sammeln und gemeinsam verschieben
- Label drucken fuer Item und Ort
- Inventarsuche mit Typauswahl
- dynamische Filter aus Item-Type-Schema
- Item-Detailseite
- Location-Detailseite
- Eingang: Item anlegen
- Verwaltung: Item-Typen ansehen/bearbeiten
- Systemseite mit API/Scanner/Drucker/Root-Status

### Spaeter

- Auto-Move vollstaendig aushaerten
- Snapshot-UI
- umfangreiche History-Visualisierung
- Desktop-Tabellenansicht
- Restore fuer geloeschte Objekte
- Backend-Scan-Resolve-Endpunkt
- Bulk-Labeldruck
- Activity Log
- Stationskonfiguration im Backend
- echte Druckerstatus-Unterstuetzung, falls Printer das kann

## Design-Entscheidungen

### Entscheidung: `/scan` ist Startseite

Begruendung:

Der haeufigste reale Workflow startet mit einem Scan, nicht mit Suche, Dashboard oder Navigation. `/` leitet deshalb auf `/scan`.

### Entscheidung: Ort-Kontext + Item-Scan verschiebt nicht automatisch

Begruendung:

Ein offener Ort ist nicht automatisch ein Zielmodus. Sonst koennte ein Nutzer beim Betrachten einer Kiste versehentlich Items dorthin verschieben. Dafuer gibt es Bulk-Modus.

### Entscheidung: Bulk sicher per Default

Begruendung:

Sammeln plus bestaetigen ist robuster als sofortiges Verschieben. Auto-Move ist praktisch, aber riskanter und muss bewusst aktiviert werden.

### Entscheidung: Labeldruck ist Kontextaktion

Begruendung:

Labels gehoeren zu Items und Orten. Eine globale Label-Hauptseite ist fuer den Alltag weniger wichtig als `Label drucken` direkt am Kontext.

### Entscheidung: Station statt User

Begruendung:

Es gibt keine Auth. Benutzerkonzepte waeren Scheingenauigkeit und wuerden falsche Erwartungen erzeugen. Systemstatus und Station sind ehrlicher und nuetzlicher.

### Entscheidung: API-nahe Begriffe aus Hauptnavigation entfernen

Begruendung:

Nutzer denken in Aufgaben: Scannen, Orte, Inventar, Eingang, Wartung. API-Ressourcen sind Implementierungsdetails.

### Entscheidung: alte `src/features` nicht in v2-Typecheck

Begruendung:

Die alten Feature-Seiten enthalten v1-Routen und Admin-Struktur. Fuer den v2-Neubau prueft `tsconfig.json` aktuell die neue Flaeche unter `src/pages`, `src/components`, `src/scanner`, `src/api` usw. Langfristig sollten alte Features geloescht oder migriert werden.

## Offene Architekturfragen

### Scan Resolve im Backend

Aktuell muss die UI bei UUID-only Scans raten:

```text
GET item
wenn 404: GET location
```

Besser:

```http
POST /v1/scan/resolve
```

Das wuerde Scanlogik zentralisieren und Labels robuster machen.

### Stationskonfiguration

Aktuell ist `Werkstatt` hart bzw. runtime-nah. Langfristig sollte es eine Backend- oder Config-basierte Station geben:

```text
station_name
default_printer_id
scanner_profile
default_intake_location_id
```

### Label Templates

Labeldruck fuer Orte braucht Template-Konfiguration. Verwaltung sollte Templates validieren und Testdrucke erlauben.

### Undo

Frontend-basiertes Undo fuer Moves ist moeglich, wenn der vorherige Ort bekannt ist. Langfristig waere ein backendseitiges Audit/Undo-Modell stabiler.

### Geloeschte Objekte

Die API kennt `include_deleted`, aber Restore-Endpunkte fehlen. Die UI darf `Geloeschte anzeigen` anbieten, sollte aber Restore nicht vortaeuschen.

## Qualitaetskriterien

Eine v2-Aenderung ist gut, wenn sie diese Fragen positiv beantwortet:

- Bleibt der Scannerflow ohne Maus bedienbar?
- Ist der naechste Scan immer klar?
- Kann ein Touch-Nutzer die Hauptaktionen sicher treffen?
- Ist der aktuelle Kontext eindeutig?
- Sind gefaehrliche Modi sichtbar?
- Sind API-Details aus der Navigation herausgehalten?
- Wird Systemstatus stationbezogen angezeigt?
- Ist die State-Machine-Regel zentral nachvollziehbar?
- Funktioniert die Ansicht bei leerem Backendzustand?
- Werden Fehler gross und verstaendlich angezeigt?

## Praktische Entwicklungsregeln

- Neue Scannerregeln zuerst in `scanner/scanStateMachine.ts` modellieren.
- Neue Scan-Code-Formate zuerst in `scanner/scanParser.ts` modellieren.
- API-Aufrufe in `src/api/*` kapseln.
- Wiederverwendbare UI nicht direkt in Pages duplizieren.
- Grosse operative Aktionen als `ActionTile` darstellen.
- Modi, die Scanverhalten aendern, mit `ModeBanner` anzeigen.
- Nach Mutationen relevante TanStack Queries invalidieren.
- Den vollen Stack fuer Druck-/API-Tests verwenden.
- `npm run typecheck` und `npm run build` vor Abschluss ausfuehren.

## Leitlinie

Die UI soll immer wieder zu dieser einen Frage zurueckkehren:

```text
Was wurde erkannt, wo ist es, und was passiert beim naechsten Scan?
```

Wenn eine neue Funktion diese Frage verdeckt, gehoert sie wahrscheinlich nicht auf die Scanner-Startseite.
