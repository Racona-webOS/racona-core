# ElyOS Konfigurációs Útmutató

Ez az útmutató az ElyOS saját üzemeltetéséhez szükséges összes környezeti változót és konfigurációs lehetőséget ismerteti.

## Tartalomjegyzék

- [Környezeti Változók Kezelése](#környezeti-változók-kezelése)
- [Gyors Kezdés](#gyors-kezdés)
- [Környezeti Változók Referencia](#környezeti-változók-referencia)
  - [Szerver Konfiguráció](#szerver-konfiguráció)
  - [Adatbázis](#adatbázis)
  - [Alkalmazás Arculat](#alkalmazás-arculat)
  - [Hitelesítés](#hitelesítés)
  - [E-mail](#e-mail)
  - [E-mail Ellenőrzés](#e-mail-ellenőrzés)
  - [Többnyelvűség](#többnyelvűség)
  - [Naplózás](#naplózás)
  - [Kezdeti Adminisztrátor](#kezdeti-adminisztrátor)
  - [Fejlesztői Mód](#fejlesztői-mód)
  - [Demó Mód](#demó-mód)
  - [Publikus Oldal](#publikus-oldal)
  - [Bővítményrendszer](#bővítményrendszer)
  - [Ütemező](#ütemező)
- [Saját Üzemeltetési Útmutató](#saját-üzemeltetési-útmutató)
  - [Minimális Telepítés (Docker)](#minimális-telepítés-docker)
  - [Teljes Éles Telepítés](#teljes-éles-telepítés)
- [Docker Konfiguráció](#docker-konfiguráció)
- [E-mail Szolgáltató Beállítása](#e-mail-szolgáltató-beállítása)
- [Biztonsági Konfiguráció](#biztonsági-konfiguráció)

---

## Környezeti Változók Kezelése

Az ElyOS **Varlock**-ot használ a typesafe környezeti változók kezeléséhez. A Varlock az alkalmazás indításakor validálja az összes konfigurációt, így a hibás beállítások azonnal kiderülnek.

A részletes Varlock dokumentációért lásd a [fejlesztői dokumentációt](https://docs.elyos.dev/hu/varlock).

### Bootstrap credentials

A `.env` fájlban csak a bootstrap credentials marad:

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

Minden más secret az Infisical-ból kerül lekérésre futásidőben.

### Lokális fallback mód

Offline fejlesztéshez vagy Infisical nélküli használathoz:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=lokalis-titok
# ... összes többi változó
```

---

## Gyors Kezdés

1. Másold le a példa környezeti fájlt:

   ```bash
   cp .env.example .env
   ```

2. Állítsd be a szükséges változókat:

   ```bash
   # Minimum szükséges a helyi fejlesztéshez
   DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
   NODE_ENV=development
   BETTER_AUTH_SECRET=generálj-egy-véletlenszerű-titkot
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. Indítsd el Docker-rel:

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

   Vagy futtasd helyben:

   ```bash
   bun install
   bun db:init
   bun app:dev
   ```

---

## Környezeti Változók Referencia

### Szerver Konfiguráció

| Változó           | Kötelező | Alapértelmezett | Leírás                                                         |
| ----------------- | -------- | --------------- | -------------------------------------------------------------- |
| `NODE_ENV`        | Igen     | —               | Alkalmazás környezet: `development`, `production` vagy `test`  |
| `BODY_SIZE_LIMIT` | Nem      | `10485760`      | Maximális kérés méret bájtban (10 MB)                          |
| `ELYOS_PORT`      | Nem      | `3000`          | Az ElyOS alkalmazás portja (Docker host port leképezés)        |
| `APP_URL`         | Éles     | —               | Az ElyOS példány alap URL-je (pl. `https://elyos.example.com`) |

### Adatbázis

| Változó             | Kötelező | Alapértelmezett | Leírás                                                               |
| ------------------- | -------- | --------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`      | Igen     | —               | PostgreSQL kapcsolati sztring: `postgresql://USER:PASS@HOST:PORT/DB` |
| `POSTGRES_USER`     | Igen     | —               | PostgreSQL felhasználónév                                            |
| `POSTGRES_PASSWORD` | Igen     | —               | PostgreSQL jelszó                                                    |
| `POSTGRES_HOST`     | Igen     | `localhost`     | PostgreSQL szerver címe                                              |
| `POSTGRES_DB`       | Igen     | —               | PostgreSQL adatbázis neve                                            |
| `POSTGRES_PORT`     | Igen     | `5432`          | PostgreSQL port                                                      |

> **Megjegyzés:** A `DATABASE_URL` automatikusan épül fel a `POSTGRES_*` változókból a sémában. Docker Compose használatakor a `POSTGRES_HOST` értéke `postgres` (a szolgáltatás neve).

### Alkalmazás Arculat

| Változó          | Kötelező | Alapértelmezett | Leírás                                                               |
| ---------------- | -------- | --------------- | -------------------------------------------------------------------- |
| `APP_NAME`       | Nem      | `ElyOS`         | Az alkalmazás megjelenített neve a felületen és az e-mailekben       |
| `APP_LOGO_URL`   | Nem      | —               | Logó URL — abszolút (`https://...`) vagy relatív (`/logo-small.png`) |
| `EMAIL_USE_LOGO` | Nem      | `false`         | Logó kép használata az e-mailekben szöveg helyett                    |

### Hitelesítés

| Változó                | Kötelező | Alapértelmezett | Leírás                                                                                                                                                                                                      |
| ---------------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Éles     | —               | Titkos kulcs az auth tokenek aláírásához. Generálás: `openssl rand -base64 32`                                                                                                                              |
| `BETTER_AUTH_URL`      | Igen     | —               | Alap URL az auth visszahívásokhoz. Meg kell egyeznie az `APP_URL`-lel                                                                                                                                       |
| `ORIGIN`               | Éles     | —               | Az alkalmazás publikus URL-je — a SvelteKit CSRF védelméhez szükséges. Meg kell egyeznie az `APP_URL`-lel (pl. `https://elyos.example.com`). Nélküle a remote function hívások 403-as hibával meghiúsulnak. |
| `REGISTRATION_ENABLED` | Nem      | `true`          | Új felhasználó regisztráció engedélyezése                                                                                                                                                                   |
| `SOCIAL_LOGIN_ENABLED` | Nem      | `true`          | Közösségi bejelentkezési szolgáltatók engedélyezése (Google)                                                                                                                                                |
| `GOOGLE_CLIENT_ID`     | Nem      | —               | Google OAuth 2.0 kliens azonosító                                                                                                                                                                           |
| `GOOGLE_CLIENT_SECRET` | Nem      | —               | Google OAuth 2.0 kliens titok                                                                                                                                                                               |

### E-mail

| Változó                | Kötelező | Alapértelmezett | Leírás                                                      |
| ---------------------- | -------- | --------------- | ----------------------------------------------------------- |
| `EMAIL_PROVIDER`       | Nem      | `resend`        | E-mail szolgáltató: `smtp`, `resend`, `sendgrid` vagy `ses` |
| `EMAIL_TEST_MODE`      | Nem      | `false`         | E-mailek naplózása a konzolra küldés helyett                |
| `EMAIL_LOG_LEVEL`      | Nem      | `debug`         | E-mail naplózási szint: `debug`, `info`, `warn`, `error`    |
| `EMAIL_OTP_EXPIRES_IN` | Nem      | `10`            | OTP lejárati idő percben (1–20)                             |

**SMTP változók** (`EMAIL_PROVIDER=smtp` esetén kötelező):

| Változó           | Kötelező | Alapértelmezett | Leírás                                       |
| ----------------- | -------- | --------------- | -------------------------------------------- |
| `SMTP_HOST`       | Igen     | —               | SMTP szerver hosztnév                        |
| `SMTP_PORT`       | Igen     | —               | SMTP szerver port (587 TLS-hez, 465 SSL-hez) |
| `SMTP_SECURE`     | Nem      | `false`         | SSL/TLS kapcsolat használata                 |
| `SMTP_USERNAME`   | Igen     | —               | SMTP hitelesítési felhasználónév             |
| `SMTP_PASSWORD`   | Igen     | —               | SMTP hitelesítési jelszó                     |
| `SMTP_FROM_EMAIL` | Nem      | —               | Feladó e-mail cím                            |
| `SMTP_FROM_NAME`  | Nem      | —               | Feladó megjelenített neve                    |
| `SMTP_REPLY_TO`   | Nem      | —               | Válaszcím e-mail                             |

**Resend változók** (`EMAIL_PROVIDER=resend` esetén kötelező):

| Változó                 | Kötelező | Alapértelmezett | Leírás                                      |
| ----------------------- | -------- | --------------- | ------------------------------------------- |
| `RESEND_API_KEY`        | Igen     | —               | Resend API kulcs (`re_` előtaggal kezdődik) |
| `RESEND_FROM_EMAIL`     | Igen     | —               | Ellenőrzött feladó e-mail                   |
| `RESEND_VERIFIED_EMAIL` | Nem      | —               | Ellenőrzött e-mail teszteléshez             |
| `RESEND_WEBHOOK_SECRET` | Nem      | —               | Webhook aláíró titok                        |

**SendGrid változók** (`EMAIL_PROVIDER=sendgrid` esetén kötelező):

| Változó               | Kötelező | Alapértelmezett | Leírás                                        |
| --------------------- | -------- | --------------- | --------------------------------------------- |
| `SENDGRID_API_KEY`    | Igen     | —               | SendGrid API kulcs (`SG.` előtaggal kezdődik) |
| `SENDGRID_FROM_EMAIL` | Igen     | —               | Ellenőrzött feladó e-mail                     |

**AWS SES változók** (`EMAIL_PROVIDER=ses` esetén kötelező):

| Változó                 | Kötelező | Alapértelmezett | Leírás                          |
| ----------------------- | -------- | --------------- | ------------------------------- |
| `AWS_REGION`            | Igen     | —               | AWS régió (pl. `eu-central-1`)  |
| `AWS_ACCESS_KEY_ID`     | Igen     | —               | AWS hozzáférési kulcs azonosító |
| `AWS_SECRET_ACCESS_KEY` | Igen     | —               | AWS titkos hozzáférési kulcs    |

### E-mail Ellenőrzés

| Változó                           | Kötelező | Alapértelmezett | Leírás                                                           |
| --------------------------------- | -------- | --------------- | ---------------------------------------------------------------- |
| `REQUIRE_EMAIL_VERIFICATION`      | Nem      | `true`          | E-mail ellenőrzés megkövetelése új fiókoknál                     |
| `EMAIL_VERIFICATION_EXPIRES_IN`   | Nem      | `86400`         | Ellenőrző link lejárati ideje másodpercben (max: 604800 = 7 nap) |
| `AUTO_SIGNIN_AFTER_VERIFICATION`  | Nem      | `false`         | Automatikus bejelentkezés sikeres ellenőrzés után                |
| `VERIFICATION_FEATURE_ENABLED`    | Nem      | `true`          | Fő kapcsoló az e-mail ellenőrzéshez                              |
| `VERIFICATION_NEW_USERS_ONLY`     | Nem      | `false`         | Csak új felhasználóknál kötelező az ellenőrzés                   |
| `VERIFICATION_ROLLOUT_PERCENTAGE` | Nem      | `100`           | Az ellenőrzés alá eső felhasználók százaléka (0–100)             |
| `VERIFICATION_ROLLOUT_START_DATE` | Nem      | —               | ISO 8601 dátum a bevezetés kezdetéhez                            |

### Többnyelvűség

| Változó             | Kötelező | Alapértelmezett | Leírás                                                        |
| ------------------- | -------- | --------------- | ------------------------------------------------------------- |
| `SUPPORTED_LOCALES` | Nem      | `hu,en`         | Vesszővel elválasztott támogatott nyelvi kódok listája        |
| `DEFAULT_LOCALE`    | Nem      | `hu`            | Alapértelmezett nyelv (a `SUPPORTED_LOCALES`-ban kell lennie) |

### Naplózás

| Változó       | Kötelező | Alapértelmezett | Leírás                                                                |
| ------------- | -------- | --------------- | --------------------------------------------------------------------- |
| `LOG_TARGETS` | Nem      | `console`       | Vesszővel elválasztott naplózási célok: `console`, `file`, `database` |
| `LOG_LEVEL`   | Nem      | `error`         | Minimális naplózási szint: `debug`, `info`, `warn`, `error`, `fatal`  |
| `LOG_DIR`     | Nem      | `./logs`        | Naplófájlok könyvtára (ha a `file` cél aktív)                         |

### Kezdeti Adminisztrátor

| Változó            | Kötelező | Alapértelmezett | Leírás                                                                                |
| ------------------ | -------- | --------------- | ------------------------------------------------------------------------------------- |
| `ADMIN_USER_EMAIL` | Igen     | —               | Az első adminisztrátor felhasználó e-mail címe (db:init / db:reset során használatos) |

### Fejlesztői Mód

| Változó    | Kötelező | Alapértelmezett | Leírás                                                          |
| ---------- | -------- | --------------- | --------------------------------------------------------------- |
| `DEV_MODE` | Nem      | `false`         | Fejlesztői bővítmény betöltés engedélyezése localhost URL-ekről |

> **Biztonsági figyelmeztetés:** Soha ne engedélyezd a `DEV_MODE`-ot éles környezetben. Lehetővé teszi tetszőleges kód betöltését localhost-ról, ami kizárólag bővítményfejlesztésre szolgál.

### Demó Mód

| Változó                   | Kötelező | Alapértelmezett | Leírás                                                                                     |
| ------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------ |
| `DEMO_MODE`               | Nem      | `false`         | Demó mód engedélyezése (csak olvasható, nincs valós adatmódosítás)                         |
| `DEMO_RESET_HOUR`         | Nem      | `4`             | Óra (UTC, 0–23), amikor a demó adatbázis naponta visszaáll                                 |
| `DEMO_RESET_UPLOADS_KEEP` | Nem      | —               | Vesszővel elválasztott feltöltési alkönyvtárak, amelyeket meg kell őrizni visszaállításkor |

### Publikus Oldal

| Változó               | Kötelező | Alapértelmezett | Leírás                                                                                           |
| --------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `PUBLIC_SITE_ENABLED` | Nem      | `true`          | Publikus oldal engedélyezése. `false` értékre állítva minden forgalom az `/admin`-ra irányítódik |

### Bővítményrendszer

| Változó                    | Kötelező | Alapértelmezett      | Leírás                                                          |
| -------------------------- | -------- | -------------------- | --------------------------------------------------------------- |
| `PLUGIN_PACKAGE_EXTENSION` | Nem      | `elyospkg`           | Bővítménycsomag fájlkiterjesztés (pont nélkül)                  |
| `PLUGIN_MAX_SIZE`          | Nem      | `10485760`           | Maximális bővítménycsomag méret bájtban (max: 100 MB)           |
| `PLUGIN_STORAGE_DIR`       | Nem      | `/var/webos/plugins` | Telepített bővítményfájlok könyvtára                            |
| `PLUGIN_TEMP_DIR`          | Nem      | `/tmp/webos-plugins` | Ideiglenes könyvtár bővítmény feltöltésekhez és kicsomagoláshoz |
| `PLUGIN_FILE_MAX_BYTES`    | Nem      | `10485760`           | A bővítmények által tárolt fájlok (`file_access`) mérethatára bájtban. Nem lehet nagyobb a `BODY_SIZE_LIMIT`-nél |

A `file_access` jogú bővítmények fájljai az `uploads/plugin-files/` mappába kerülnek. A mentésbe a teljes `uploads` mappát vedd fel: ebben vannak ezek a fájlok, a hátterek, az avatarok és a telepített bővítmények is.

### Ütemező

A bővítmények a manifestjükben ütemezett feladatokat deklarálhatnak (`scheduledJobs`, `scheduler` jogosultság); a core a saját karbantartó feladatait is így futtatja. Az ütemező az alkalmazás folyamatán belül fut, az állapotát az adatbázisban tartja (`platform.scheduled_jobs`), így nem kell hozzá rendszer-cron. A feladatok az adatbázisban zárolódnak: több alkalmazáspéldánynál is csak egyszer futnak. Az ütemezett emailek linkje az `APP_URL`-re mutat, ezért élesben állítsd be.

| Változó                          | Kötelező | Alapértelmezett   | Leírás                                                                  |
| -------------------------------- | -------- | ----------------- | ----------------------------------------------------------------------- |
| `SCHEDULER_ENABLED`              | Nem      | `true`            | Ütemezett feladatok futtatása ezen a példányon                          |
| `SCHEDULER_TICK_SECONDS`         | Nem      | `30`              | Az esedékes feladatok ellenőrzésének gyakorisága (5–3600 mp)            |
| `SCHEDULER_START_DELAY_SECONDS`  | Nem      | `15`              | Az első ellenőrzés késleltetése induláskor (mp)                         |
| `SCHEDULER_MAX_CONCURRENT`       | Nem      | `2`               | Egyszerre futó feladatok példányonként (1–20)                           |
| `SCHEDULER_JOB_TIMEOUT_SECONDS`  | Nem      | `600`             | Alapértelmezett időkorlát, ha a feladat nem ad meg sajátot (10–3600 mp) |
| `SCHEDULER_MISSED_GRACE_SECONDS` | Nem      | `300`             | A `catchUp: "skip"` feladatok ennél későbbi futása kimarad (mp)         |
| `SCHEDULER_DEFAULT_TIMEZONE`     | Nem      | `Europe/Budapest` | A cron kifejezések alapértelmezett IANA időzónája                       |
| `SCHEDULER_RUN_RETENTION_DAYS`   | Nem      | `30`              | A futásnapló megőrzése (nap)                                            |

---

## Saját Üzemeltetési Útmutató

### Minimális Telepítés (Docker)

Az ElyOS futtatásának leggyorsabb módja a Docker Compose. Ez elindítja az ElyOS-t és a PostgreSQL-t ésszerű alapértelmezésekkel.

1. Klónozd a tárolót:

   ```bash
   git clone https://github.com/elyos/elyos-core.git
   cd elyos-core
   ```

2. Hozz létre egy minimális `.env` fájlt:

   ```bash
   # .env
   BETTER_AUTH_SECRET=a-te-véletlenszerű-titkod
   POSTGRES_PASSWORD=az-adatbázis-jelszavad
   ADMIN_USER_EMAIL=admin@example.com
   ```

3. Indítsd el a szolgáltatásokat:

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. Nyisd meg a `http://localhost:3000` címet a böngésződben.

Ennyi az egész. A Docker Compose automatikusan kezeli az adatbázis beállítását, a migrációkat és a hálózatot.

### Teljes Éles Telepítés

Éles telepítésekhez állítsd be az összes biztonsági szempontból fontos változót:

```bash
# .env (éles)

# Szerver
NODE_ENV=production
ELYOS_PORT=3000
APP_URL=https://elyos.yourdomain.com

# Adatbázis
POSTGRES_USER=elyos
POSTGRES_PASSWORD=egy-erős-véletlenszerű-jelszó
POSTGRES_HOST=postgres
POSTGRES_DB=elyos
POSTGRES_PORT=5432

# Hitelesítés
BETTER_AUTH_SECRET=generáld-openssl-rand-base64-32-vel
BETTER_AUTH_URL=https://elyos.yourdomain.com
REGISTRATION_ENABLED=true

# E-mail (válassz egy szolgáltatót)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=az-smtp-jelszavad

# Arculat
APP_NAME=Az Én ElyOS Példányom

# Adminisztrátor
ADMIN_USER_EMAIL=admin@yourdomain.com

# Naplózás
LOG_TARGETS=console,database
LOG_LEVEL=info

# Biztonság
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
```

Ezután indítsd el Docker Compose-zal:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Helyezz egy reverse proxy-t (nginx, Caddy, Traefik) az ElyOS elé a TLS lezárás kezeléséhez.

---

## Docker Konfiguráció

### Docker Compose Szolgáltatások

A `docker/docker-compose.yml` két szolgáltatást definiál:

| Szolgáltatás | Kép                            | Alapértelmezett Port | Leírás               |
| ------------ | ------------------------------ | -------------------- | -------------------- |
| `elyos`      | A `docker/Dockerfile`-ból épül | `3000`               | ElyOS webalkalmazás  |
| `postgres`   | `postgres:16-alpine`           | `5432`               | PostgreSQL adatbázis |

### Docker-Specifikus Változók

Ezeket a változókat a Docker Compose használja, és alapértelmezett értékük van a compose fájlban:

| Változó                | Alapértelmezett           | Leírás                                        |
| ---------------------- | ------------------------- | --------------------------------------------- |
| `ELYOS_PORT`           | `3000`                    | Az ElyOS konténerhez leképezett host port     |
| `POSTGRES_PORT`        | `5432`                    | A PostgreSQL konténerhez leképezett host port |
| `POSTGRES_USER`        | `elyos`                   | PostgreSQL szuperfelhasználó neve             |
| `POSTGRES_PASSWORD`    | `elyos123`                | PostgreSQL szuperfelhasználó jelszava         |
| `POSTGRES_HOST`        | `postgres`                | PostgreSQL szerver címe (szolgáltatás neve)   |
| `POSTGRES_DB`          | `elyos`                   | PostgreSQL adatbázis neve                     |
| `NODE_ENV`             | `production`              | Alkalmazás környezet a konténeren belül       |
| `DEV_MODE`             | `false`                   | Fejlesztői bővítmény betöltés engedélyezése   |
| `APP_NAME`             | `ElyOS`                   | Alkalmazás megjelenített neve                 |
| `BETTER_AUTH_URL`      | `http://localhost:3000`   | Auth visszahívás alap URL                     |
| `BETTER_AUTH_SECRET`   | `change-me-in-production` | Auth aláíró titok                             |
| `PUBLIC_SITE_ENABLED`  | `false`                   | Publikus oldal kapcsoló                       |
| `REGISTRATION_ENABLED` | `true`                    | Felhasználó regisztráció kapcsoló             |
| `DEFAULT_LOCALE`       | `hu`                      | Alapértelmezett nyelv                         |
| `SUPPORTED_LOCALES`    | `hu,en`                   | Elérhető nyelvek                              |
| `LOG_TARGETS`          | `console`                 | Naplózási kimeneti célok                      |
| `LOG_LEVEL`            | `info`                    | Minimális naplózási szint                     |

> **Fontos:** A `DATABASE_URL` automatikusan épül fel a Docker Compose-on belül a `POSTGRES_*` változókból. Ne állítsd be a `DATABASE_URL`-t a `.env` fájlban Docker használatakor — felül lesz írva.

### Adatmegőrzés

A PostgreSQL adatok egy elnevezett Docker kötetben (`elyos-data`) tárolódnak. Ez megmarad a konténer újraindítások és a `docker compose down` után is. Az adatbázis teljes visszaállításához:

```bash
docker compose -f docker/docker-compose.yml down -v
```

### Egyéni Docker Compose Felülírások

Hozz létre egy `docker-compose.override.yml` fájlt a testreszabáshoz az eredeti módosítása nélkül:

```yaml
# docker-compose.override.yml
services:
  elyos:
    environment:
      - DEV_MODE=true
    ports:
      - '8080:3000'
```

---

## E-mail Szolgáltató Beállítása

Az ElyOS négy e-mail szolgáltatót támogat. Állítsd be az `EMAIL_PROVIDER`-t és konfiguráld a megfelelő változókat.

### SMTP

Bármely SMTP szerverrel működik (Gmail, Outlook, Mailgun, egyéni).

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

> Gmail esetén használj [Alkalmazásjelszót](https://support.google.com/accounts/answer/185833) a fiók jelszavad helyett.

### Resend

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### AWS SES

```bash
EMAIL_PROVIDER=ses
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Tesztelés E-mail Nélkül

Állítsd az `EMAIL_TEST_MODE=true` értéket, hogy az összes e-mail a konzolra kerüljön küldés helyett. Hasznos helyi fejlesztéshez.

---

## Biztonsági Konfiguráció

### Hitelesítési Titkok

Generálj erős `BETTER_AUTH_SECRET`-et éles környezethez:

```bash
openssl rand -base64 32
```

Soha ne használd újra a titkokat különböző környezetekben. A titok cseréje érvényteleníti az összes meglévő munkamenetet.

### Kétfaktoros Hitelesítés (2FA)

Az ElyOS támogatja a TOTP-alapú 2FA-t biztonsági kódokkal. Ez felhasználónként a Beállítások alkalmazásban konfigurálható — nincs szükség környezeti változókra.

### Regisztráció Szabályozása

- `REGISTRATION_ENABLED=false` — letiltja az új felhasználói regisztrációt (az adminisztrátor továbbra is létrehozhat felhasználókat)
- `PUBLIC_SITE_ENABLED=false` — minden nem hitelesített forgalmat a bejelentkezési oldalra irányít

### Fejlesztői Mód Biztonsága

A `DEV_MODE=true` lehetővé teszi bővítmények betöltését `localhost` URL-ekről. Ez biztonsági kockázat éles környezetben, mert tetszőleges kódfuttatást tesz lehetővé. Éles környezetben mindig állítsd `DEV_MODE=false` értékre.

### Ajánlott Éles Beállítások

```bash
NODE_ENV=production
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
REQUIRE_EMAIL_VERIFICATION=true
BETTER_AUTH_SECRET=<erős-véletlenszerű-érték>
POSTGRES_PASSWORD=<erős-véletlenszerű-érték>
ADMIN_USER_EMAIL=admin@example.com
```
