<p align="center">
  <img src="https://elyos.hu/logo.png" alt="ElyOS Logo" width="120" />
</p>

<!-- <h1 align="center">ElyOS</h1> -->

<p align="center">
  Teljes értékű asztali élmény webes technológiákkal. Nyílt forráskódú, ingyenes, bárhonnan elérhető.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@elyos-dev/sdk"><img src="https://img.shields.io/npm/v/@elyos-dev/sdk?label=%40elyos-dev%2Fsdk&color=blue" alt="SDK npm version" /></a>
    <a href="https://www.npmjs.com/package/@elyos-dev/create-app"><img src="https://img.shields.io/npm/v/@elyos-dev/create-app?label=%40elyos-dev%2Fcreate-app&color=blue" alt="CLI npm version" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
    <a href="https://github.com/ElyOS-webOS/elyos-core/releases"><img src="https://img.shields.io/github/package-json/v/ElyOS-webOS/elyos-core" alt="Verzió" /></a>
</p>

<p align="center">
  <a href="https://elyos.hu">Weboldal</a> · <a href="https://docs.elyos.hu">Dokumentáció (felhasználói)</a> · <!-- <a href="./docs/hu/PLUGIN_DEVELOPMENT.md">Plugin fejlesztés</a> ·--> <a href="./docs/hu/CONTRIBUTING.md">Közreműködés</a> · <a href="./docs/hu/TROUBLESHOOTING.md">Hibaelhárítás</a> · <a href="./README.md">🇬🇧 English</a>
</p>

---

<!-- Screenshot placeholder -->
<!-- <p align="center"><img src="https://elyos.hu/screenshots/desktop.png" alt="ElyOS Asztal" width="800" /></p> -->

## Tartalomjegyzék

- [Mi az ElyOS?](#mi-az-elyos)
- [Funkciók](#funkciók)
- [Beépített alkalmazások](#beépített-alkalmazások)
- [Tech Stack](#tech-stack)
- [Gyors kezdés](#gyors-kezdés)
  - [Előfeltételek](#előfeltételek)
  - [Környezeti változók konfigurálása](#környezeti-változók-konfigurálása)
  - [Docker segítségével (ajánlott)](#docker-segítségével-ajánlott)
  - [Alapértelmezett rendszergazda fiók](#alapértelmezett-rendszergazda-fiók)
  - [Lokális fejlesztés](#lokális-fejlesztés)
  - [Gyakori parancsok](#gyakori-parancsok)
- [Projekt struktúra](#projekt-struktúra)
- [Docker](#docker)
- [Plugin fejlesztés](#plugin-fejlesztés)
- [Dokumentáció](#dokumentáció)
- [Közreműködés](#közreműködés)
- [Felelősség kizárása](#felelősség-kizárása)
- [Licenc](#licenc)

## Mi az ElyOS?

Az ElyOS ötvözi a hagyományos asztali operációs rendszerek funkcionalitását a modern webtechnológiák rugalmasságával. A felhasználók teljes asztali környezetet érnek el — ablakkezelés, tálca, start menü, asztali parancsikonok, helyi menü — kizárólag a böngészőn keresztül.

Moduláris és bővíthető: készíts saját alkalmazásokat pluginként az SDK segítségével, vagy futtasd az egész platformot önállóan Dockerrel.

## Funkciók

- **Ablakkezelés** — húzás, átméretezés, minimalizálás, maximalizálás, illesztés
- **Tálca és Start menü** — testreszabható pozíció, rács/lista nézet, keresés
- **Asztali parancsikonok** — drag-and-drop, jobb kattintásos helyi menü
- **Plugin rendszer** — telepíts harmadik féltől származó alkalmazásokat, vagy készíts sajátot az `@elyos/sdk`-val
- **Hitelesítés** — email/jelszó, email OTP, Google bejelentkezés, 2FA (TOTP)
- **Többnyelvűség** — adatbázis-alapú i18n, futásidejű nyelvváltással
- **Valós idejű chat** — beépített üzenetküldés Socket.IO-n keresztül
- **Sötét/Világos mód** — rendszerszintű témaváltás
- **Önállóan futtatható** — egyetlen Docker Compose paranccsal elindítható

## Beépített alkalmazások

| Alkalmazás    | Leírás                               |
| ------------- | ------------------------------------ |
| Beállítások   | Megjelenés, biztonság, nyelv, asztal |
| Felhasználók  | Fiók-, csoport- és szerepkörkezelés  |
| Napló         | Rendszer- és hibanapló megjelenítő   |
| Plugin kezelő | Pluginok feltöltése és telepítése    |
| Chat          | Valós idejű belső üzenetküldés       |
| Értesítések   | Rendszerértesítések kezelése         |
| Súgó          | Beépített dokumentációböngésző       |

## Tech Stack

| Réteg          | Technológia                                         |
| -------------- | --------------------------------------------------- |
| Frontend       | SvelteKit 2, Svelte 5, TypeScript 5, Tailwind CSS 4 |
| Backend        | SvelteKit szerver, Express + Socket.IO              |
| Adatbázis      | PostgreSQL Drizzle ORM-en keresztül                 |
| Hitelesítés    | better-auth (email, OTP, Google, 2FA)               |
| Runtime        | Bun                                                 |
| Infrastruktúra | Docker + Docker Compose                             |
| Tesztelés      | Vitest, fast-check, Playwright                      |

## Gyors kezdés

### Előfeltételek

- [Docker](https://docker.com) és Docker Compose — kötelező
  > **macOS felhasználóknak ajánlott:** Docker Desktop helyett érdemes [OrbStack](https://orbstack.dev)-et használni. Az OrbStack lényegesen gyorsabb konténer- és VM-indítást kínál, töredék annyi memóriát és CPU-t fogyaszt, natívan integrálja a macOS Keychain-t, és sokkal kisebb az alkalmazás mérete is. Ráadásul ingyenes személyes használatra.
- [Bun](https://bun.sh) (v1.0+) — opcionális, az előre definiált `bun docker:*` parancsok kényelmes futtatásához szükséges; Bun nélkül is elindítható a rendszer, csak a nyers Docker-parancsokat kell használni

### Környezeti változók konfigurálása

> **Ez egy kritikus lépés. Ha kihagyod vagy helytelenül töltöd ki, funkciók fognak meghibásodni.**

Az indítás előtt másold le a példafájlt és töltsd ki az értékeket:

```bash
cp .env.example .env
```

**Varlock + Infisical használatával (ajánlott):** Csak két változó szükséges a `.env` fájlban:

```bash
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

Az összes többi secret (adatbázis URL, auth secret, SMTP hitelesítő adatok stb.) futásidőben kerül lekérésre az Infisical-ból. Infisical hozzáférés igényléséhez fordulj a csapat adminisztrátorához, és kérj Machine Identity-t a saját környezetedhez.

**Infisical nélkül (lokális fallback mód):** Állítsd be a `VARLOCK_FALLBACK=local` értéket, és add meg az összes változót a `.env` fájlban. A `.env.example` fájl tartalmazza az összes elérhető változót dokumentációval.

| Változó                                     | Kötelező                     | Mi történik, ha hiányzik vagy helytelen                                                        |
| ------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `INFISICAL_CLIENT_ID`                       | Mindig (Infisical mód)       | A Varlock nem tud hitelesíteni — az alkalmazás nem indul el                                    |
| `INFISICAL_CLIENT_SECRET`                   | Mindig (Infisical mód)       | A Varlock nem tud hitelesíteni — az alkalmazás nem indul el                                    |
| `VARLOCK_FALLBACK=local`                    | Csak lokális fallback módhoz | Enélkül a Varlock az Infisical-hoz próbál csatlakozni                                          |
| `BETTER_AUTH_SECRET`                        | Csak fallback módban         | Az auth tokenek nem írhatók alá — a bejelentkezés meghibásodik                                 |
| `APP_URL` / `ORIGIN`                        | Csak fallback módban         | A SvelteKit CSRF védelem blokkol minden szerver akciót (403), az auth callback-ek sem működnek |
| `DATABASE_URL`                              | Csak fallback módban         | Az alkalmazás nem tud csatlakozni az adatbázishoz                                              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Csak Google bejelentkezéshez | A Google-lel való bejelentkezés nem fog működni                                                |
| `SMTP_*` / `RESEND_API_KEY` / stb.          | Csak email funkciókhoz       | Az email megerősítés, OTP és jelszó-visszaállítás nem fog működni                              |
| `ADMIN_USER_EMAIL`                          | Ajánlott                     | A rendszergazda fiók a seed adatokban lévő alapértelmezett emailt kapja                        |

A teljes környezeti változó referenciáért és a Varlock konfigurációs részletekért lásd a [`docs/CONFIGURATION.md`](./docs/CONFIGURATION.md) fájlt.

### Fejlesztői onboarding

A lokális fejlesztői környezet Infisical-lal való beállításához:

1. **Kérj Infisical hozzáférést** — fordulj a csapat adminisztrátorához, és kérj Machine Identity-t az `elyos-core` projekthez a `development` környezetben.
2. **Kapd meg a bootstrap credentials-t** — kapsz egy `INFISICAL_CLIENT_ID`-t és `INFISICAL_CLIENT_SECRET`-et.
3. **Konfiguráld a `.env` fájlt:**
   ```bash
   cp .env.example .env
   # Add hozzá a bootstrap credentials-t:
   INFISICAL_CLIENT_ID=your-client-id
   INFISICAL_CLIENT_SECRET=your-client-secret
   ```
4. **Indítsd el az alkalmazást** — a Varlock automatikusan lekéri az összes secretet az Infisical-ból indításkor.

Ha még nincs Infisical hozzáférésed, használd a lokális fallback módot:

```bash
# .env
VARLOCK_FALLBACK=local
# ... töltsd ki az összes változót a .env.example alapján
```

### Docker segítségével (ajánlott)

Ez a módszer egy teljesen önálló, futtatható rendszert hoz létre Docker konténerekben. Az ElyOS és az adatbázis egyaránt konténerben fut, így **nincs szükség Node.js, Bun vagy PostgreSQL helyi telepítésére** — elegendő a Docker megléte.

**Bun segítségével (ha telepítve van):**

```bash
# Repository klónozása
git clone https://github.com/ElyOS-webOS/elyos-core
cd elyos-core

# Környezeti változók másolása és konfigurálása (lásd fenti szakasz)
cp .env.example .env

# ElyOS + PostgreSQL indítása
bun docker:up

# Megnyitás böngészőben
open http://localhost:3000
```

**Bun nélkül (csak Docker szükséges):**

```bash
# Repository klónozása
git clone https://github.com/ElyOS-webOS/elyos-core
cd elyos-core

# Környezeti változók másolása és konfigurálása (lásd fenti szakasz)
cp .env.example .env

# ElyOS + PostgreSQL indítása
docker compose -f docker/docker-compose.yml up -d

# Megnyitás böngészőben
open http://localhost:3000
```

### Alapértelmezett rendszergazda fiók

Az első indítás után a rendszer egy előre beállított rendszergazda felhasználóval indul, aki teljes hozzáféréssel rendelkezik.

- **Email:** az `.env` fájlban megadott `ADMIN_USER_EMAIL` értéke
- **Jelszó:** `Admin123.`

> **Fontos:** Az első bejelentkezés után azonnal változtasd meg a jelszót a **Beállítások → Biztonság** menüpontban.

### Lokális fejlesztés

```bash
# Függőségek telepítése
bun install

# Környezeti változók másolása és konfigurálása (lásd fenti szakasz)
cp .env.example .env

# PostgreSQL indítása
bun docker:db

# Adatbázis inicializálása (generálás + migráció + seed)
bun db:init

# Fejlesztői szerver indítása
bun app:dev
```

Az alkalmazás elérhető lesz a `http://localhost:5173` címen.

### Gyakori parancsok

```bash
bun app:dev           # Fejlesztői szerver indítása
bun app:build         # Éles build
bun app:check         # Típusellenőrzés (svelte-check + tsc)

bun db:generate       # Migrációk generálása sémaváltozásokból
bun db:migrate        # Függőben lévő migrációk futtatása
bun db:studio         # Drizzle Studio megnyitása
bun db:seed           # Adatbázis feltöltése tesztadatokkal
bun db:reset          # Adatbázis visszaállítása

bun docker:up         # Docker konténerek indítása
bun docker:down       # Docker konténerek leállítása
bun docker:logs       # Konténer naplók követése
bun docker:db         # Csak PostgreSQL indítása (lokális fejlesztéshez)

bun test              # Összes teszt futtatása (apps/web-ből)
bun lint              # Lint ellenőrzés
bun format            # Kód formázása
```

## Projekt struktúra

```
elyos-core/
├── apps/web/                     # Fő SvelteKit alkalmazás
│   └── src/
│       ├── routes/               # Fájlalapú routing
│       ├── apps/                 # Beépített asztali alkalmazások
│       └── lib/                  # Megosztott könyvtárak, komponensek, store-ok
├── packages/
│   ├── database/                 # Drizzle ORM sémák, migrációk, seed-ek
│   ├── sdk/                      # @elyos/sdk — plugin SDK (npm)
│   └── create-elyos-app/      # CLI eszköz plugin generáláshoz (npm)
├── examples/plugins/             # Példa plugin implementációk
├── docker/                       # Dockerfile és docker-compose.yml
├── docs/                         # Dokumentáció
└── .github/                      # CI/CD workflow-ok, issue/PR sablonok
```

## Plugin fejlesztés

Az ElyOS teljes plugin ökoszisztémával rendelkezik. Hozz létre pluginokat a CLI-vel, fejlessz a mock SDK-val, majd töltsd be őket egy futó ElyOS példányba.

> **Hamarosan...** Részletes dokumentáció és útmutatók a plugin fejlesztéshez.

## Docker

### Önálló futtatás

```bash
bun docker:up
```

Ez elindítja a teljes rendszert három konténerben, sorban:

1. **postgres** — PostgreSQL 18 adatbázis (egyedi image, `postgres-json-schema` extensionnel)
2. **db-init** — egyszeri inicializálás: Drizzle migrációk + seed adatok betöltése (csak akkor indul, ha a postgres egészséges)
3. **elyos** — maga az alkalmazás (csak akkor indul, ha a db-init sikeresen lefutott)

Az alkalmazás elérhető lesz a `http://localhost:3000` címen (konfigurálható: `ELYOS_PORT`), a PostgreSQL az `5432`-es porton (konfigurálható: `POSTGRES_PORT`).

### Adatbázis inicializálás és reset

A `db-init` konténer (és a `bun db:init` script) **idempotens** — biztonságosan futtatható többször is, nem duplikál adatokat (upsert logika).

Ha teljes adatbázis-visszaállításra van szükség (minden adat törlése és újraseedelés a kezdeti állapotba):

```bash
RESET=1 bun docker:up
```

Ez ugyanazt a `db-init` konténert futtatja, de truncate-eli az összes táblát a seed előtt.

### Környezeti változók

Az összes konfigurációs lehetőségért lásd a [`.env.example`](./.env.example) fájlt.

### Image build

```bash
docker build -f docker/Dockerfile -t elyos/core:latest .
```

## Dokumentáció

<!--
- [Plugin fejlesztési útmutató](./docs/hu/PLUGIN_DEVELOPMENT.md) — pluginok készítése nulláról
- [API referencia](./docs/hu/API_REFERENCE.md) — teljes SDK API dokumentáció
- [Migrációs útmutató](./docs/hu/MIGRATION.md) — meglévő pluginok migrálása `@elyos/sdk`-ra -->

- [Közreműködési útmutató](./docs/hu/CONTRIBUTING.md) — fejlesztői beállítás, kódstílus, PR folyamat
- [Hibaelhárítás](./docs/hu/TROUBLESHOOTING.md) — gyakori telepítési problémák és megoldásaik
- [Felhasználói dokumentáció](https://docs.elyos.hu) — felhasználói leírás
- [Felelősség kizárása](./docs/hu/DISCLAIMER.md) — felelősségkizárás és garancia

## Közreműködés

Minden típusú hozzájárulást szívesen fogadunk — hibajavítások, új funkciók, dokumentációs fejlesztések és plugin példák egyaránt.

Kérjük, olvasd el a [Közreműködési útmutatót](./docs/hu/CONTRIBUTING.md) a pull request beküldése előtt.

## Felelősség kizárása

Az ElyOS szoftvert **"ahogy van" (as-is)** alapon bocsátjuk rendelkezésre, mindenféle kifejezett vagy hallgatólagos garancia nélkül — beleértve, de nem kizárólagosan az eladhatóságra, adott célra való alkalmasságra vagy jogsértésmentességre vonatkozó garanciákat.

A szoftver készítői és közreműködői **semmilyen felelősséget nem vállalnak** semmilyen közvetlen, közvetett, véletlenszerű, különleges, következményes vagy büntető jellegű kárért, amely a szoftver használatából, helytelen konfigurálásából, üzemeltetéséből vagy az arra való képtelenségből ered — még akkor sem, ha a kár lehetőségéről előzetesen tájékoztatást kaptak.

Ez magában foglalja, de nem korlátozódik az alábbiakra:

- adatvesztés vagy adatsérülés
- üzleti bevételkiesés vagy elmaradt haszon
- rendszerleállás vagy szolgáltatáskiesés
- biztonsági incidensek, jogosulatlan hozzáférés
- harmadik fél rendszereivel való inkompatibilitás
- bármilyen egyéb vagyoni vagy nem vagyoni kár

A szoftver használata teljes mértékben a felhasználó saját felelősségére és kockázatára történik. Éles (production) környezetben való üzemeltetés előtt a felhasználó felelőssége a megfelelő biztonsági audit, konfiguráció és tesztelés elvégzése.

Részletekért lásd a [teljes felelősségkizárót](./docs/hu/DISCLAIMER.md) és a [LICENSE](./LICENSE) fájlt.

## Licenc

[MIT](./LICENSE)
