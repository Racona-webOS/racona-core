# Változásnapló

[🇬🇧 English version](./CHANGELOG.md)

Az összes lényeges változás ebben a projektben dokumentálva van.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült,
és ez a projekt a [Semantic Versioning](https://semver.org/spec/v2.0.0.html) szabályait követi.

## [0.2.0] - 2026-04-11

### Javítva

- **Plugin adat endpointok** (`/api/plugins/[pluginId]/data/*`): mind a négy endpoint (`query`, `get`, `set`, `delete`) `plugin_` sémanév prefixet használt a helyes `app__` helyett — javítva, hogy egyezzen a telepítő `sanitizeSchemaName` kimenetével
- **Plugin adat query endpoint**: kereszt-séma hozzáférés ellenőrzés frissítve `plugin_`-ről `app__` prefix mintára

### Hozzáadva (`@elyos-dev/sdk@0.2.0`)

- Verzió bump az összes csomag `0.2.0`-ra egységesítéséhez

### Hozzáadva (`@elyos-dev/create-app@0.2.0`)

- **Teljesen újraírt CLI — funkció-alapú scaffolding** _(breaking change)_: a régi fix template-ek (`basic`, `advanced`, `datatable`, `sidebar`) helyett interaktív feature-választó (`sidebar`, `database`, `remote_functions`, `notifications`, `i18n`, `datatable`) vezérli a generálást — egyetlen `generateProject()` kódút `hasFeature()` ellenőrzésekkel, `normalizeFeatures()` és `computePermissions()` pure helper függvényekkel
- **Datatable feature — beszúró űrlap**: a generált `Datatable.svelte` tartalmaz "Elem hozzáadása" űrlapot a táblázat alatt (`database` feature esetén), `name` és `value` mezőkkel, core CSS változókkal stílusozva és dark mode támogatással
- **Datatable feature — sor akciók**: `createActionsColumn` két akcióval soronként: **Duplikálás** (elsődleges) és **Törlés** (másodlagos, destructive/piros) — törlés `sdk.ui.dialog()` megerősítő modallal
- **Datatable feature — teljes i18n**: minden hardkódolt szöveg `t()` hívásra cserélve; új fordítási kulcsok (`datatable.columns.*`, `datatable.form.*`, `datatable.delete.*`, `datatable.success.*`, `datatable.error.*`, `datatable.duplicate`, `datatable.delete`)
- **Datatable feature — szerver függvények**: generált `server/functions.ts` exportálja az `insertItem`, `deleteItem` és `duplicateItem` függvényeket, helyes `app__${pluginId}` sémanév prefixszel
- **Összes komponens sablon — gomb stílus**: `Notifications`, `Remote` és `Datatable` komponensek `btn-primary` CSS változó alapú stílust használnak natív gombok helyett

## [0.1.9] - 2026-04-10

### Javítva

- **Plugin eltávolítás — desktop parancsikonok törlése**: plugin eltávolításakor az összes, az adott pluginra mutató desktop parancsikon törlődik az adatbázisból (minden felhasználónál)
- **Plugin eltávolítás — nyitott ablakok bezárása**: az eltávolítás után a kliens oldal bezárja az érintett plugin összes nyitott ablakát, mielőtt visszanavigál
- **Remote függvények**: `query()` → `command()` migráció a `chat.remote.ts`-ben, `appRegistry.remote.ts`-ben és `plugins.remote.ts`-ben
- **Plugin telepítő**: sémanév prefix `plugin_`-ről `app__`-re változott; `pool.query()` használata `db.execute()` helyett; `prefixMigrationSchema` regex javítva
- **Plugin telepítő**: érvénytelen JSON email template fájlok mostantól figyelmeztetéssel kihagyódnak telepítési hiba helyett
- **Email manager**: plugin template névvalidáció mostantól elfogadja az `appId:templateName` formátumot regex-szel
- **Remote function handler**: üzleti logika hibák mostantól HTTP 200-as `{ success: false }` választ adnak HTTP 500 helyett, hogy a kliens kezelni tudja őket
- **Remote function handler**: a szerver függvények mostantól `pluginDb` pg-pool-kompatibilis interfészt kapnak (`query`, `connect`) a Drizzle ORM példány helyett
- **Remote function handler**: `.ts` fallback a `server/functions` útvonalhoz (dev mód támogatás)
- **Plugin menu API**: mostantól beolvassa a `layout` mezőt a `manifest.json`-ból és visszaadja a menü adatokkal együtt
- **PluginDialog**: `confirmLabel` és `confirmVariant` opciók támogatása a `DialogOptions`-ból
- **Vite config**: `uploads/plugins/**` és `uploads/plugins-temp/**` kizárva a fájlfigyelőből

### Hozzáadva

- **Plugin layout**: a `PluginLayoutWrapper` mostantól regisztrálja az SDK `navigateTo`, `setActionBar` és `clearActionBar` handlereket — a pluginok az SDK-n keresztül navigálhatnak nézetek között és kezelhetik az action bart
- **Plugin layout**: `maxWidthClass` prop a `PluginLayoutWrapper`-en és `AppLayout`-on a plugin-specifikus layout szélesség vezérléséhez (a `manifest.json` `layout` mezőjéből olvasva)
- **Plugin layout**: a plugin által `sdk.ui.setActionBar()`-ral beállított action bar elemek megjelennek a layout fejlécében; komponens navigációkor automatikusan törlődnek

### Hozzáadva (`@elyos-dev/sdk@0.1.22`)

- **`UIService.navigateTo(component, props?)`**: navigálás egy névvel ellátott komponensre a plugin layouton belül
- **`UIService.setActionBar(items)`**: action bar gombok beállítása az aktuális nézethez
- **`UIService.clearActionBar()`**: action bar törlése
- **`ActionBarItem` típus**: új interfész action bar gomb definíciókhoz (label, onClick, variant, icon, disabled)
- **`DialogOptions.confirmLabel`**: egyéni felirat a megerősítő gombhoz
- **`DialogOptions.confirmVariant`**: vizuális variáns (`default` | `destructive`) a megerősítő gombhoz
- **Exportok**: `DialogOptions`, `DialogResult`, `ActionBarItem` mostantól exportálva az SDK fő belépési pontjából

### Javítva (`@elyos-dev/create-app@0.1.10`)

- **Generált projekt függőségek**: `@lucide/svelte` frissítve `^0.561.0`-ról `^1.0.0`-ra a generált `package.json`-ban
- **Generált projekt függőségek**: `@elyos-dev/sdk` frissítve `^0.1.16`-ról `^0.1.22`-re a generált `package.json`-ban

## [0.1.8] - 2026-04-09

- **Kisebb hibajavítások**

## [0.1.7] - 2026-04-08

### Hozzáadva

- **Plugin Email Service**: a remote function context mostantól tartalmaz egy `email` service-t (`context.email.send()`) a `notifications` jogosultsággal rendelkező pluginok számára — a template nevek automatikusan prefixelődnek a plugin ID-val (pl. `'employee_welcome'` → `'ely-work:employee_welcome'`)
- **Plugin telepítő — email template regisztráció**: a telepítő beolvassa az `email-templates/*.json` fájlokat telepítéskor, és locale-onként külön sorban regisztrálja őket a `platform.email_templates` táblába, `{appId}:{fájlnév}` type formátummal
- **Plugin eltávolítás — email template törlés**: plugin eltávolításakor az `{appId}:%` prefixű email template rekordok törlődnek a `platform.email_templates` táblából
- **Template Registry — plugin template feloldás**: a `TemplateRegistry` mostantól feloldja az `appId:templateName` formátumú neveket az adatbázisból, lehetővé téve a pluginok által regisztrált template-ek használatát az `EmailManager`-en keresztül

### Tesztek

- Property-based teszt az email template név prefixeléshez (Property 10, validálja a 12.4 követelményt)
- Unit tesztek a `PluginInstaller.importEmailTemplates()` és `removeEmailTemplates()` metódusokhoz (validálja a 12.6, 12.10 követelményeket)

## [0.1.6] - 2026-04-08

### Javítva (`@elyos-dev/create-app@0.1.7`)

- **Sidebar template**: standalone dev módban a tartalmi komponensek most helyesen jelenítik meg a fordított szövegeket — a mock SDK egy nem-reaktív `$state` closure-t használt; javítva azzal, hogy a locale fájlok betöltése a `main.ts`-ben történik és átadódik a `MockWebOSSDK.initialize()`-nak
- **Sidebar template**: locale váltáskor a tartalmi komponensek azonnal frissülnek — a `setLocale()` most szinkron módon hívódik meg a `currentLocale` state változása előtt, így a `{#key}` újramountoláskor már a helyes locale van érvényben
- **Összes template** (`basic`, `advanced`, `datatable`, `sidebar`): a `main.ts` most dinamikusan tölti be a fordításokat a `locales/*.json` fájlokból hardcoded stringek helyett — a locale fájlok az egyetlen forrás
- **Sidebar template komponensek** (`Overview`, `Settings`): eltávolítva a `tr` state objektum boilerplate és a `$effect`-alapú i18n betöltés; a komponensek most közvetlenül `sdk.i18n.t(key)`-t használnak, összhangban a többi template-tel
- **Starter template generátor**: a `generateBlankMainTs` most mindig locale fájl betöltést használ, ha `blankI18n` engedélyezve van, függetlenül a `blankSidebar` opciótól
- **Starter template generátor**: a `generateBlankOverviewSvelte` most `sdk.i18n.t()` mintával generál komponenseket statikus szöveg helyett

## [0.1.5] - 2026-04-07

### Javítva

- Dev plugin betöltő: `host.docker.internal` URL-ek engedélyezése Docker-ben futó ElyOS esetén
- Dev plugin betöltő: a böngésző `localhost` URL-t kap (konvertálva `host.docker.internal`-ről), így a plugin mindkét oldalról helyesen töltődik be
- Dev plugin ablak betöltés után fókuszt kap
- Dev plugin betöltő UI szövegek teljes lokalizációja (i18n kulcsok, Docker hint hozzáadva)

### Hozzáadva

- Új fordítási kulcsok a Dev Plugin Loader panelhez (hu/en)

## [0.1.0] - 2026-03-07

### Hozzáadva

- Az ElyOS első nyilvános kiadása
- Teljes asztali környezet a böngészőben ablakkezeléssel, tálcával és start menüvel
- Beépített alkalmazások: Beállítások, Felhasználók, Napló, Plugin kezelő, Chat, Értesítések, Súgó
- Plugin rendszer WebOS SDK-val harmadik féltől származó alkalmazások fejlesztéséhez _(fejlesztés alatt)_
- Hitelesítési rendszer email/jelszóval, OTP-vel, Google bejelentkezéssel és 2FA-val (TOTP)
- Adatbázis-alapú többnyelvűség (i18n) futásidejű nyelvváltással
- Valós idejű chat Socket.IO-n keresztül
- Sötét/Világos mód támogatása
- Docker Compose beállítás önálló futtatáshoz
- Átfogó dokumentáció és hibaelhárítási útmutató

### Dokumentáció

- Konfigurációs útmutató a környezeti változókhoz
- Hibaelhárítási útmutató a gyakori telepítési problémákhoz (angol és magyar)
- Közreműködési útmutató
- Projekt struktúra dokumentáció
