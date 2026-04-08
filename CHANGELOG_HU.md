# Változásnapló

[🇬🇧 English version](./CHANGELOG.md)

Az összes lényeges változás ebben a projektben dokumentálva van.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült,
és ez a projekt a [Semantic Versioning](https://semver.org/spec/v2.0.0.html) szabályait követi.

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
