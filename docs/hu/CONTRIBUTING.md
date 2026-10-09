# Hozzájárulás a Raconához

Köszönjük, hogy érdeklődsz a Racona fejlesztése iránt! Ez az útmutató segít az indulásban, bemutatja a konvencióinkat, és végigvezet az első hozzájárulás beküldésén.

## Tartalomjegyzék

- [Magatartási kódex](#magatartási-kódex)
- [Előfeltételek](#előfeltételek)
- [Fejlesztői környezet beállítása](#fejlesztői-környezet-beállítása)
- [Projektstruktúra](#projektstruktúra)
- [Kódstílus és konvenciók](#kódstílus-és-konvenciók)
- [Commit üzenetek](#commit-üzenetek)
- [Branching stratégia](#branching-stratégia)
- [Pull Request folyamat](#pull-request-folyamat)
- [Hibajelentés](#hibajelentés)
- [Fejlesztési tippek](#fejlesztési-tippek)
- [Segítségkérés](#segítségkérés)

---

## Magatartási kódex

### Vállalásunk

Elkötelezettek vagyunk amellett, hogy mindenki számára befogadó, barátságos és zaklatásmentes élményt nyújtsunk, kortól, testalkattól, fogyatékosságtól, etnikai hovatartozástól, nemi identitástól és kifejezésmódtól, tapasztalati szinttől, nemzetiségtől, megjelenéstől, fajtól, vallástól, valamint szexuális identitástól és orientációtól függetlenül.

### Elvárt viselkedés

- Légy tisztelettudó és figyelmes minden interakció során
- Fogadd szívesen az újonnan érkezőket, és segítsd őket az indulásban
- Fogadd el az építő jellegű kritikát nyitottan
- Arra összpontosíts, ami a közösség és a projekt számára a legjobb
- Mutass empátiát a közösség többi tagja iránt

### Elfogadhatatlan viselkedés

- Zaklatás, trollkodás vagy személyes támadások
- Mások személyes adatainak közzététele hozzájárulás nélkül
- Diszkriminatív nyelvezet vagy képanyag
- Bármilyen viselkedés, amely szakmai környezetben nem lenne elfogadható

### Érvényesítés

A projekt karbantartói eltávolíthatják, szerkeszthetik vagy elutasíthatják azokat a hozzászólásokat, commitokat, kódokat, issue-kat és egyéb hozzájárulásokat, amelyek megsértik ezt a Magatartási kódexet. Ismétlődő vagy súlyos szabálysértés esetén ideiglenes vagy végleges kitiltás következhet.

A szabálysértéseket privát issue megnyitásával vagy a karbantartók közvetlen megkeresésével lehet jelenteni.

---

## Előfeltételek

Mielőtt elkezdenéd, győződj meg róla, hogy a következők telepítve vannak:

- **[Bun](https://bun.sh)** v1.0+ (elsődleges futtatókörnyezet és csomagkezelő)
- **[Node.js](https://nodejs.org)** v20+ (szükséges a webalkalmazáshoz)
- **[Docker](https://docker.com)** és Docker Compose (PostgreSQL-hez és konténerizált fejlesztéshez)
- **[Git](https://git-scm.com)** v2.30+

---

## Fejlesztői környezet beállítása

### 1. Fork és klónozás

```bash
# Forkold a repót GitHub-on, majd:
git clone https://github.com/<your-username>/racona-core.git
cd racona-core
git remote add upstream https://github.com/szigetidev/racona-core.git
```

### 2. Függőségek telepítése

```bash
bun install
```

### 3. Környezeti változók beállítása

```bash
cp .env.example .env
# Szerkeszd a .env fájlt a helyi beállításaiddal (az alapértékek a Docker konfigurációhoz megfelelőek)
# Fontos: töltsd ki a kötelező értékeket, mint a BETTER_AUTH_SECRET, ORIGIN és az adatbázis hitelesítő adatok
```

> **Megjegyzés:** Az `ORIGIN` változónak meg kell egyeznie az alkalmazás URL-jével (pl. `http://localhost:3000`). Enélkül a remote function hívások 403-as hibával meghiúsulnak a SvelteKit CSRF védelme miatt.

### 4. Adatbázis indítása

```bash
bun docker:db        # Csak PostgreSQL indítása Docker-ben (lokális fejlesztéshez)
bun db:init          # Migrációk generálása, futtatása és adatbázis feltöltése
```

### 5. Fejlesztői szerver indítása

```bash
bun app:dev          # SvelteKit fejlesztői szerver indítása
```

A Racona ezután elérhető a `http://localhost:5173` címen.

### Hasznos parancsok

| Parancs                  | Leírás                                                      |
| ------------------------ | ----------------------------------------------------------- |
| `bun app:dev`            | Fejlesztői szerver indítása                                 |
| `bun app:build`          | Éles build készítése                                        |
| `bun app:check`          | Típusellenőrzés svelte-check + tsc segítségével             |
| `bun test`               | Összes teszt futtatása (`apps/web`-ből)                     |
| `bun lint`               | Formázás és linting ellenőrzése                             |
| `bun format`             | Automatikus formázás Prettier-rel                           |
| `bun db:init`            | Első telepítés (generálás + migráció + seed)                |
| `bun db:generate`        | Migrációk generálása sémaváltozásokból                      |
| `bun db:migrate`         | Függőben lévő migrációk futtatása                           |
| `bun db:seed`            | Adatbázis feltöltése tesztadatokkal                         |
| `bun db:reset`           | Adatbázis visszaállítása                                    |
| `bun db:studio`          | Drizzle Studio megnyitása                                   |
| `bun docker:db`          | Csak a PostgreSQL konténer indítása (lokális fejlesztéshez) |
| `bun docker:up`          | Összes Docker konténer indítása (build-del)                 |
| `bun docker:rebuild`     | Konténerek újraépítése cache nélkül, majd indítása          |
| `bun docker:down`        | Docker konténerek leállítása                                |
| `bun docker:logs`        | Konténer naplók követése                                    |
| `bun docker:build`       | Docker image buildelése (`racona/core:latest`)              |
| `bun docker:build:multi` | Multi-platform image buildelése (amd64 + arm64)             |
| `bun docker:save`        | Docker image mentése `.tar` fájlba                          |

---

## Projektstruktúra

```
racona-core/
├── apps/web/                  # Fő SvelteKit alkalmazás
│   └── src/
│       ├── apps/              # Beépített asztali alkalmazások
│       ├── lib/               # Megosztott könyvtári kód
│       │   ├── components/    # UI komponensek (core, shared, ui)
│       │   ├── server/        # Csak szerver oldali kód (adatbázis, email, pluginok)
│       │   ├── stores/        # Globális Svelte 5 rune store-ok
│       │   └── utils/         # Segédfüggvények
│       └── routes/            # SvelteKit fájlalapú routing
├── packages/
│   ├── database/              # Drizzle ORM sémák, migrációk, seed-ek
│   ├── sdk/                   # @racona/sdk — Plugin SDK csomag
│   └── cli/                   # CLI eszköz pluginok létrehozásához
├── examples/plugins/          # Példa plugin implementációk
├── docker/                    # Dockerfile és docker-compose konfiguráció
├── docs/                      # Projekt dokumentáció
└── scripts/                   # Segédeszköz szkriptek
```

Részletes leírásért lásd a [Projektstruktúra](../README.md) részt a fő README-ben.

---

## Kódstílus és konvenciók

### Nyelv

A kódbázis belső megjegyzésekhez, változónevekhez és dokumentációhoz **magyar** nyelvet használ. Meglévő fájlok módosításakor kövesd az adott fájlban már jelen lévő nyelvi konvenciót. A nyilvános dokumentáció (mint ez a fájl) angolul készül.

### TypeScript

- **Strict mód** engedélyezve — kerüld az `any` használatát, ahol lehetséges
- Exportált függvényeknél használj explicit visszatérési típust
- Objektum alakzatokhoz az `interface`-t részesítsd előnyben a `type`-pal szemben
- Belső importokhoz használd a `$lib/...` útvonal aliasokat

### Svelte 5

A Racona **Svelte 5-öt rune-okkal** használ. Főbb minták:

- Reaktivitáshoz használd a `$state`, `$derived` és `$effect` rune-okat (ne a régi `$:` szintaxist)
- Osztályalapú store-ok `$state` tulajdonságokkal, `createX()` / `setX()` / `getX()` függvényeken keresztül exportálva
- A store fájlok `.svelte.ts` kiterjesztést használnak

### Formázás és linting

**Prettier**-t és **ESLint**-et használunk. A Prettier konfiguráció (`.prettierrc`):

- Tabulátor a behúzáshoz
- Szimpla idézőjelek
- Nincs záró vessző
- 100 karakter sorszélesség

Commitolás előtt mindig futtasd:

```bash
bun format            # Automatikus formázás
bun lint              # Problémák ellenőrzése
```

### CSS

- **Tailwind CSS 4** a Vite pluginon keresztül (nincs `tailwind.config` fájl)
- Részesítsd előnyben a Tailwind utility osztályokat az egyedi CSS-sel szemben
- Svelte-ben feltételes osztályokhoz használd a `class:` direktívát

### Szerver akciók

A szerver oldali logika a `*.remote.ts` fájlokban a következő mintát követi:

- `command(schema, handler)` mutációkhoz
- `query(handler)` olvasásokhoz
- Mindig validáld a bemenetet **Valibot** sémákkal
- Visszatérési érték: `{ success: boolean, error?: string, ...data }`

### Adatbázis

- A sémák a `packages/database/src/schemas/` könyvtárban találhatók
- Minden adatbázis-művelethez **Drizzle ORM**-et használj
- Sémaváltozások után futtasd a `bun db:generate` parancsot a migrációk létrehozásához

### Tesztelés

- **Vitest** egységtesztekhez
- **fast-check** tulajdonságalapú tesztekhez
- **Playwright** végponttól végpontig (e2e) tesztekhez
- Tesztek futtatása az `apps/web` könyvtárból: `bun test`

---

## Commit üzenetek

A **[Conventional Commits](https://www.conventionalcommits.org/)** specifikációt követjük.

### Formátum

```
<típus>(<hatókör>): <leírás>

[opcionális törzs]

[opcionális lábléc(ek)]
```

### Típusok

| Típus      | Leírás                                                               |
| ---------- | -------------------------------------------------------------------- |
| `feat`     | Új funkció                                                           |
| `fix`      | Hibajavítás                                                          |
| `docs`     | Csak dokumentációs változtatások                                     |
| `style`    | Formázás, hiányzó pontosvesszők stb. (nem kódváltozás)               |
| `refactor` | Kódváltozás, ami sem hibát nem javít, sem funkciót nem ad hozzá      |
| `perf`     | Teljesítményjavítás                                                  |
| `test`     | Tesztek hozzáadása vagy frissítése                                   |
| `build`    | Build rendszer vagy függőségek változtatása                          |
| `ci`       | CI/CD konfiguráció változtatása                                      |
| `chore`    | Egyéb változtatások, amelyek nem módosítják a src vagy test fájlokat |

### Hatókör

Használd a csomag vagy terület nevét hatókörként:

- `core` — fő SvelteKit alkalmazás (`apps/web`)
- `sdk` — SDK csomag (`packages/sdk`)
- `cli` — CLI eszköz (`packages/cli`)
- `db` — adatbázis csomag (`packages/database`)
- `docker` — Docker konfiguráció
- `docs` — dokumentáció

### Példák

```
feat(core): add keyboard shortcuts to window manager
fix(sdk): resolve mock data service localStorage race condition
docs(cli): update template selection instructions
refactor(db): simplify user schema relations
test(core): add property-based tests for taskbar sorting
ci: add arm64 platform to Docker build
```

### Törő változások

Törő változásoknál adj hozzá `!`-t a típus/hatókör után, és használj `BREAKING CHANGE:` láblécet:

```
feat(sdk)!: rename DataService.query to DataService.sql

BREAKING CHANGE: DataService.query() has been renamed to DataService.sql()
to better reflect its purpose. Update all plugin code accordingly.
```

---

## Branching stratégia

- `main` — stabil, éles környezetbe kész kód
- `develop` — integrációs branch a következő kiadáshoz
- `feat/<név>` — funkció branchek (`develop`-ból ágaznak ki)
- `fix/<név>` — hibajavító branchek (`develop`-ból vagy `main`-ből hotfix esetén)

```bash
# Funkció branch létrehozása
git checkout develop
git pull upstream develop
git checkout -b feat/my-feature

# Hibajavító branch létrehozása
git checkout develop
git pull upstream develop
git checkout -b fix/my-bugfix
```

---

## Pull Request folyamat

### Beküldés előtt

1. **Szinkronizálás az upstream-mel:**

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Összes ellenőrzés futtatása:**

   ```bash
   bun format
   bun lint
   bun app:check
   bun test              # az apps/web könyvtárból
   ```

3. **Maradj fókuszban** — egy PR egy funkcióhoz vagy javításhoz. Kerüld az egymáshoz nem kapcsolódó változtatások keverését.

### PR beküldése

1. Pushold a branchedet a saját forkodba
2. Nyiss egy Pull Requestet a `develop` branch felé
3. Töltsd ki a PR sablont a következőkkel:
   - A változtatás egyértelmű leírása és indoklása
   - Kapcsolódó issue szám(ok) (pl. `Closes #42`)
   - Képernyőképek vagy felvételek UI változtatásoknál
   - Törő változások vagy migrációs lépések, ha vannak

### Áttekintési folyamat

- Legalább **egy karbantartó jóváhagyása** szükséges a mergelés előtt
- A CI ellenőrzéseknek (lint, típusellenőrzés, tesztek, build) sikeresen le kell futniuk
- A reviewerek kérhetnek módosításokat — kezeld a visszajelzéseket és pushold a frissítéseket ugyanarra a branchre
- Jóváhagyás után a karbantartó **squash and merge** módszerrel mergeli

### PR tippek

- Írj leíró címet a conventional commit formátumban
- Tartsd a PR-eket kicsinek és áttekinthetőnek (lehetőleg 400 sor diff alatt)
- Adj hozzá inline megjegyzéseket a saját PR-edhez a nem nyilvánvaló döntések magyarázatához
- Válaszolj a review visszajelzésekre időben

---

## Hibajelentés

### Hibabejelentések

Hiba bejelentésekor add meg a következőket:

- **Leírás** — mi történt, és mi volt az elvárt viselkedés
- **Reprodukálási lépések** — minimális lépések a hiba kiváltásához
- **Környezet** — operációs rendszer, böngésző, Bun verzió, Node.js verzió
- **Képernyőképek vagy naplók** — ha releváns
- **Racona verzió** — commit hash vagy kiadási tag

### Funkciókérések

Funkció kérésekor add meg a következőket:

- **Probléma** — milyen problémát old meg?
- **Javasolt megoldás** — hogyan kellene működnie?
- **Megvizsgált alternatívák** — milyen más megközelítéseket fontoltál meg?
- **További kontextus** — mockupok, példák vagy hivatkozások

### Címkék

A karbantartók a következő címkékkel kategorizálják az issue-kat:

- `bug` — megerősített hiba
- `enhancement` — funkciókérés
- `good first issue` — kezdőknek megfelelő
- `help wanted` — közösségi hozzájárulás szívesen fogadva
- `documentation` — dokumentáció fejlesztése szükséges
- `wontfix` — nem tervezett

---

## Fejlesztési tippek

### Beépített alkalmazásokkal való munka

Minden alkalmazásnak a `src/apps/[app-name]/` könyvtárban saját belépési pontja (`index.svelte`), ikonja és opcionális szerver akciói vannak. Új beépített alkalmazás hozzáadásához:

1. Hozz létre egy könyvtárat a `src/apps/` alatt
2. Add hozzá az `index.svelte` (belépési pont) és `icon.svg` fájlokat
3. Add hozzá a `*.remote.ts` fájlokat a szerver oldali logikához
4. Regisztráld az alkalmazást az alkalmazás-regisztrációban

### Hot Reload

A fejlesztői szerver támogatja a hot module replacement-et. A `.svelte`, `.ts` és `.css` fájlok változásai azonnal megjelennek teljes oldal újratöltés nélkül.

### Adatbázis változtatások

1. Módosítsd a sémákat a `packages/database/src/schemas/` könyvtárban
2. Futtasd a `bun db:generate` parancsot a migráció létrehozásához
3. Futtasd a `bun db:migrate` parancsot az alkalmazáshoz
4. Teszteld a `bun db:studio` segítségével az adatbázis vizsgálatához

### Specifikus tesztek futtatása

```bash
# Összes teszt futtatása
cd apps/web && bun test

# Egy adott tesztfájl futtatása
cd apps/web && bunx vitest run src/lib/utils/myUtil.test.ts

# Csak tulajdonságalapú tesztek futtatása
cd apps/web && bun test:pbt
```

---

## Segítségkérés

- **Issues** — keress a meglévő issue-k között, vagy nyiss egy újat
- **Discussions** — használd a GitHub Discussions-t kérdésekhez és ötletekhez
- **Dokumentáció** — nézd meg a `docs/` könyvtárat az útmutatókért

Köszönjük, hogy hozzájárulsz a Raconához! Minden hozzájárulás számít, legyen bármilyen kicsi. 🎉
