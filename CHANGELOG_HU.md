# Változásnapló

[🇬🇧 English version](./CHANGELOG.md)

Az összes lényeges változás ebben a projektben dokumentálva van.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült,
és ez a projekt a [Semantic Versioning](https://semver.org/spec/v2.0.0.html) szabályait követi.

## [Unreleased]

### Hozzáadva

- **Plugin email válaszcím**: a `context.email.send()` opcionális `replyTo` paramétert fogad, így a plugin levelenként megadhatja a Reply-To címet. Ha nincs megadva, a rendszerszintű `SMTP_REPLY_TO` érvényes, mint eddig.
- **Mobil keret**: telefonon az asztali felület (ablakok, tálca) helyett egyszerű mobil felület jelenik meg. Egyszerre egy app látszik teljes képernyőn; alul kezdőlap, értesítések, megnyitott appok és profil (sötét mód, kijelentkezés). A nézet a böngészőelőzményben él, így a telefon vissza gesztusa az előző nézetre lép.
  - A keretet a szerver választja a böngészőazonosító alapján: telefon → mobil, minden más (táblagép is) → asztali. Egy asztali böngésző összeszűkítése nem vált mobilra. Kézzel is váltható (Profil → „Asztali nézet”, telefonon a start menüből vissza), a választást a `racona_shell` süti őrzi.
  - Mobilon csak az jelenik meg, ami mobilra készült; az ablakkezelő nem menti az ablakméreteket, így a telefonos használat nem írja felül az asztaliakat.
- **Mobil bejegyzések a plugin manifestben** (`mobile.entries`: `id`, `label`, `icon`, `component`): a plugin képernyői, amelyek mobilon gyors műveletként, önállóan nyílnak meg. A core ellenőrzi (kebab-case, egyedi azonosító, legfeljebb 12) és a `platform.apps.mobile` oszlopba menti (`0012_app_mobile` migráció). Az értesítésből akkor nyílik meg az app mobilon, ha az adataiban a `mobileEntry` egy bejegyzésre mutat.
- **Közvetlen link egy apphoz**: `/admin?app=<app>&entry=<mobil bejegyzés>` vagy `&section=<menüpont>` (pl. e-mailekből). Csak a felhasználó számára elérhető app nyílik meg; asztalon a bejegyzés képernyője az app ablakában. Kijelentkezve a belépőoldal megőrzi a kért címet (`?redirectTo=`), és belépés után oda visz vissza; csak `/admin` alatti cím fogadható el.
- **SDK**: `sdk.context.shell` (`'desktop' | 'mobile'`), hogy a plugin tudja, melyik felületen fut (`@racona/sdk` 0.8.0).

### Változott

- **Munkamenet eszköztípusonként**: egy felhasználónak egyszerre egy asztali és egy mobil munkamenete lehet; a telefonos belépés már nem lépteti ki az asztali gépet. Új belépéskor csak az azonos típusú munkamenet törlődik; a típus nélküli régi munkamenetek asztalinak számítanak (`0011_session_device_type` migráció: `auth.sessions.device_type`, index a `user_id`-ra, a `user_agent` `text` típusú).
- A belépőoldal telefonon teljes szélességű, a magassága nem ugrál a mobil címsorral, és kikerüli a kivágást (`viewport-fit=cover`).
- A start menü nem lóghat ki a képernyőből.
- Fejlesztőknek: a felület közös indítása (`ShellRuntime`) és az ablak tartalma (`WindowContent`) külön komponensbe került, így az asztali és a mobil keret ugyanazt használja.
- Frissítéskor: a `db:migrate` (vagy a Docker `db:init`) futtatja az új migrációkat; a mobil felület feliratai a `desktop` névtér `mobile.*` kulcsai (`translations_desktop` seed).

### Javítva

- Fejlesztői módban a telefonos belépés a helyi hálózatról (`vite dev --host`, 3000-es port) nem akadt el „Invalid origin” hibával.

## [0.5.0] - 2026-10-06

### Hozzáadva

- **Ütemező**: a pluginok ütemezett feladatokat deklarálhatnak a manifestben (`scheduledJobs` + `scheduler` jogosultság, a handlerek a `server/jobs.ts`-ben). Az ütemező az alkalmazás folyamatán belül fut, az állapotát az adatbázisban tartja (`platform.scheduled_jobs`, `platform.scheduled_job_runs`), és `FOR UPDATE SKIP LOCKED`-del zárolja a feladatokat, így több alkalmazáspéldánynál is egyszer fut egy feladat. A leállás alatt kimaradt futást újraindítás után pótolja (`catchUp: 'once'`).
  - Plugin kezelő: új „Ütemezett feladatok” oldal és szakasz a plugin részletező oldalán — következő/utolsó futás, ki/bekapcsolás, „Futtatás most”, futásnapló a naplósorokkal. Új jogosultság: `plugin.scheduler.manage`.
  - A core karbantartó feladatai naponta lefutnak: régi ütemezett futások, 90 napnál régebbi email naplók, 7 napnál régebbi félbehagyott plugin feltöltések és frissítési mentések törlése.
  - Konfiguráció: `SCHEDULER_*` környezeti változók (lásd docs/hu/CONFIGURATION.md).
- **Plugin fájltárolás**: a `file_access` jogú pluginok `context.files` szolgáltatást kapnak a remote függvényekben és az ütemezett feladatokban (`save`, `get`, `read`, `delete`, `claim`, `createUploadUrl`, `createDownloadUrl`). A fájlok a lemezre kerülnek (`uploads/plugin-files/{pluginId}/`), a metaadat a `platform.plugin_files` táblába (`0009_plugin_files` migráció). Hogy ki tölthet fel és le, azt a plugin dönti el; a böngésző rövid életű, a felhasználóhoz kötött, aláírt linkeket használ (`POST /api/plugins/:pluginId/files/upload/:token`, `GET /api/plugins/:pluginId/files/download/:token`), a fájltípust a tartalomból ismeri fel a core. A plugin eltávolításakor a fájlok megmaradnak.
  - Új core feladat: `core.plugin-files-cleanup` — törli a 24 óra alatt be nem kötött feltöltéseket és a félbemaradt feltöltéseket.
  - Konfiguráció: `PLUGIN_FILE_MAX_BYTES` (alapérték 10 MiB). A mentésbe a teljes `uploads` mappát vedd fel.
  - Dev szerver: a Vite nem figyeli az `uploads/plugin-files/` mappát, így egy feltöltés nem tölti újra a lapot.

### Változott

- A `/api/files/list` csak a core kategóriáit listázza (`backgrounds`, `documents`, `avatars`, `images`), és a `type` paraméterben nem fogad el útvonal-karaktert; korábban `../`-vel az `uploads` bármelyik mappája kilistázható volt. A `/api/files/...` a `plugin-files/` mappát soha nem szolgálja ki, a core `saveFile` pedig elutasítja a fenntartott `plugins` és `plugin-files` kategóriát.
- Az email és i18n szolgáltatás a szerver indulásakor indul (SvelteKit `init` hook), nem az első kérésnél, így az ütemezett feladatok kérés nélkül is küldhetnek emailt.
- **Core fájltárolás** (`saveFile`, `deleteFile`, `/api/files/...`):
  - A `shared` scope-ba feltölteni és onnan törölni az új `files.shared.manage` jogosultsággal lehet (új `files` erőforrás; alapból Sysadmin és Admin). Korábban bármely bejelentkezett felhasználó feltölthetett közös fájlt, törölni viszont senki sem tudta. A `0010_files_shared_manage` migráció a meglévő adatbázisokhoz is hozzáadja a jogosultságot, és megkapja minden szerepkör és csoport, amelynek van `settings.update` jogosultsága.
  - A `/api/files/...` `Cache-Control: private` fejlécet küld (`public` helyett), így proxy és CDN nem tárolja a bejelentkezéshez kötött fájlokat.
  - A `Content-Type` a `platform.files` táblában tárolt (feltöltéskor a tartalomból felismert) MIME típus; a kiterjesztés csak a rekord nélküli fájloknál számít. HTML, JavaScript, SVG és XML mindig `application/octet-stream`-ként, `Content-Disposition: attachment` fejléccel megy ki; inline csak kép, hang, videó, PDF és sima szöveg jelenik meg.
  - A feltöltési mérethatár a `BODY_SIZE_LIMIT`-hez igazodik: a fájl base64-ként utazik, így a kéréskorlát kb. háromnegyede használható. A `FileUploader` alapértéke 7 MB (10 MB helyett, ami 7,5 és 10 MB között hibára futott), a `saveFile` ellenőrzi a méretet, és a feltöltő érthető üzenetet ad, ha a szerver a kérés mérete miatt utasítja el.
  - Az SVG és a BMP kikerült az engedélyezett képtípusok közül: az SVG-t a tartalom alapján nem ismeri fel a rendszer (és szkriptet futtathatna), a BMP-t a `sharp` nem tudja beolvasni; a feltöltésük eddig is mindig hibára futott.
  - Megszűntek a `src/lib/server/storage/*.remote.ts` másolatok; a remote függvények a `src/lib/storage/` mappában vannak (a `getFileMetadata` is ide került).

### Javítva

- **DatePicker**: a kívülről beállított értéket (pl. egy másik mezőből előtöltve) a naptár korábbi értéke azonnal felülírta, és végtelen frissítési ciklus is lehetett belőle (`effect_update_depth_exceeded`). Most mindkét irány csak a saját oldalának változására reagál.
- A saját háttérkép törlése (`deleteBackground`) a `platform.files` rekordot is törli; korábban csak a lemezről törölte a fájlokat.
- A bélyegkép a tárolt fájl nevét kapja (`thumb-{fájlnév}`), így akkor is egyezik, ha a feltöltött nevet egyedivé kellett tenni; a `/api/files/list` nem listázza a `thumb-` fájlokat; a tárolási útvonal és a `thumbnailUrl` mindig `/` elválasztót használ (Windows alatt `\` került bele). Feltöltött fájl neve nem kezdődhet `thumb-`-bel.
- Háttérkép feltöltése után a beállítás a tárolt fájlnevet használja, nem az eredetit (ami szóközös vagy ékezetes névnél nem működött).
- Új core feladat: `core.orphan-files-cleanup` (naponta) — törli a törölt felhasználók saját fájljait. Felhasználó törlésekor a `platform.files.user_id` null lesz, és ezek a fájlok elérhetetlenül a lemezen maradtak.

## [0.4.1] - 2026-04-27

### Javítva

- **AI Asszisztens**: az Anthropic API hívásai nem küldik együtt a `temperature` és `top_p` paramétert (az API együtt nem fogadja el őket); csak a `temperature` megy, a chatben és a kapcsolattesztben is.
- **AI Asszisztens**: a „Beszélgetés törlése” gomb felirata fordítható (eddig magyarul be volt égetve).
- **Adatbázis**: kikerült az `ai-providers` séma duplikált `aiAgentConfigs` exportja, ami miatt elbukott a build (`aiAgentConfigs is not exported by @racona/database/schemas`).
- **Docker**: az image újra elkészül Bun 1.3.13-mal (frissített lockfile, megmaradt a `--frozen-lockfile`, nincs külön TypeScript telepítés, ami módosította a lockfile-t, csak a workspace plugin példák kerülnek az image-be).

## [0.4.0] - 2026-04-27

### Hozzáadva

- **AI Asszisztens**: Teljes körű AI-alapú asszisztens rendszer chat felülettel, tudásbázis integrációval és testreszabható AI avatárokkal
  - Több szolgáltató támogatása (OpenAI, Anthropic, Google Gemini)
  - Szövegfelolvasás (TTS) böngésző és ElevenLabs szolgáltatókkal
  - Tudásbázis keresés vektor beágyazásokkal
  - AI avatar telepítés és kezelés
  - Globális admin konfiguráció AI ügynök és TTS beállításokhoz
  - Valós idejű chat felület üzenet előzményekkel
  - Konfigurálható AI paraméterek (kreativitás, max tokenek, top-p)
- **Hitelesítési Beállítások**: Admin panel a hitelesítési opciók kezeléséhez
  - Regisztráció be/kikapcsolása a Beállítások alkalmazásból
  - Social login (Google) be/kikapcsolása a Beállítások alkalmazásból
  - Adatbázis-alapú konfiguráció (környezeti változók helyett)
  - Automatikus mentés kapcsolóra kattintáskor a jobb UX érdekében

### Változtatva

- Hitelesítési konfiguráció áthelyezve környezeti változókból az adatbázisba
- `REGISTRATION_ENABLED` és `SOCIAL_LOGIN_ENABLED` környezeti változók elavultak (mostantól Beállítások > Hitelesítés menüpontban kezelhetők)

### Javítva

- IconButton és ButtonSave komponensek: `disabled` prop támogatás hozzáadva

## [0.3.2] - 2026-04-15

### Változtatva

- Brand név és dokumentáció frissítések

### Változtatva (`@racona/sdk@0.3.2`)

- Brand név és dokumentáció frissítések

### Változtatva (`@racona/cli@0.3.2`)

- Brand név és dokumentáció frissítések

## [0.3.0] - 2026-04-14

### Változtatva — Racona brand-átállás (2026-04-14)

- **Projekt átnevezve**: Racona → Racona
- **`create-elyos-app`** → **`@racona/cli`** — CLI eszköz plugin generáláshoz
- **`@elyos/sdk`** / **`@elyos-dev/sdk`** → **`@racona/sdk`** — plugin SDK
- Minden UI szöveg, dokumentáció és konfigurációs hivatkozás frissítve Racona-ról Raconára
- Domain frissítve: `elyos.hu` → `racona.hu` (301-es átirányítások érvényben)

## [0.2.2] - 2026-04-12

### Javítva

- **Start menü bezárása kívüli kattintásra**: a start menü paneljén kívülre kattintva mostantól helyesen bezáródik — megkerültük a bits-ui `DismissibleLayer` egy korlátját, amely kizárta a `ContextMenu.Trigger` elemeken (az asztali munkaterületen) történő kattintásokat a kívüli kattintás detektálásából

## [0.2.1] - 2026-04-12

### Javítva

- **Dev plugin betöltő**: az alapértelmezett URL `http://localhost:5174`-ről `http://localhost:5175`-re változott (a remote dev szerver portja)
- **Dev plugin remote hívások**: a dev pluginok remote function hívásai mostantól a dev szerverre (`devUrl`) proxy-zódnak a core API endpoint helyett (amelynek nincs DB bejegyzése dev pluginokhoz)

### Hozzáadva (`@elyos-dev/sdk@0.2.1`)

- **`SimpleDataTable` komponens**: standalone módú DataTable TanStack Table függőség nélkül — lapozás, rendezés, toolbar snippet és action gombok támogatásával
- **`SimpleRowActions` komponens**: primary gomb + dropdown a másodlagos akciókhoz — szimulálja a core `DataTableRowActions` komponenst standalone módban
- **`MockWebOSSDK.initialize()`**: mostantól fogad `extraComponents` paramétert — átadható `{ DataTable: SimpleDataTable }` az app mountolása előtt
- **`WebOSComponents` interface**: típusos mezők `DataTable`, `DataTableColumnHeader`, `renderComponent`, `renderSnippet`, `createActionsColumn`, `Input`, `Button` számára
- **`MockUIService`**: a `components` mostantól tartalmazza a `createActionsColumn`, `renderComponent`, `renderSnippet`, `DataTableColumnHeader` mock implementációkat
- **SDK exportok**: `SimpleDataTable.svelte` és `SimpleRowActions.svelte` elérhető `@elyos-dev/sdk/dev/components/SimpleDataTable.svelte` útvonalon

### Hozzáadva (`@elyos-dev/create-app@0.2.2`)

- **DataTable standalone támogatás**: a generált `Datatable.svelte` mostantól közvetlenül importálja a `SimpleDataTable`-t és standalone módban használja; core módban a valódi `DataTable` fut `svelte:component`-ként
- **`getItems` szerver függvény**: a generált `server/functions.ts` mostantól exportálja a `getItems` függvényt szerver oldali lapozással és rendezéssel
- **`loadData` `remote.call`-on keresztül**: az adatbetöltés `sdk.remote.call('getItems', ...)` hívást használ `sdk.data.query()` helyett — standalone és core módban egyaránt működik
- **`handleStateChange` újratölt**: a lapozás és rendezés változásai mostantól automatikusan meghívják a `loadData()`-t
- **`<script module lang="ts">`**: javítva az esbuild parse hiba az első `dev:full` indításkor — minden komponens module blokk mostantól TypeScript nyelvet deklarál

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

- Dev plugin betöltő: `host.docker.internal` URL-ek engedélyezése Docker-ben futó Racona esetén
- Dev plugin betöltő: a böngésző `localhost` URL-t kap (konvertálva `host.docker.internal`-ről), így a plugin mindkét oldalról helyesen töltődik be
- Dev plugin ablak betöltés után fókuszt kap
- Dev plugin betöltő UI szövegek teljes lokalizációja (i18n kulcsok, Docker hint hozzáadva)

### Hozzáadva

- Új fordítási kulcsok a Dev Plugin Loader panelhez (hu/en)

## [0.1.0] - 2026-03-07

### Hozzáadva

- A Racona első nyilvános kiadása
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
