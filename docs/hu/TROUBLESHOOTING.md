# Racona Hibaelhárítási Útmutató

Ez az útmutató a Racona telepítése és üzemeltetése során leggyakrabban előforduló problémákat foglalja össze.

## Tartalomjegyzék

- [Az alkalmazás nem indul el](#az-alkalmazás-nem-indul-el)
  - [Hiányzó kötelező környezeti változók](#hiányzó-kötelező-környezeti-változók)
  - [A port már foglalt](#a-port-már-foglalt)
  - [`NODE_ENV` nincs beállítva](#node_env-nincs-beállítva)
- [Adatbázis-problémák](#adatbázis-problémák)
  - [Nem lehet csatlakozni a PostgreSQL-hez](#nem-lehet-csatlakozni-a-postgresql-hez)
  - [Hitelesítési hiba az adatbázis-kapcsolatnál](#hitelesítési-hiba-az-adatbázis-kapcsolatnál)
  - [Migrációk nem futottak le / hiányzó táblák](#migrációk-nem-futottak-le--hiányzó-táblák)
  - [A `db-init` konténer hibával lép ki](#a-db-init-konténer-hibával-lép-ki)
- [Hitelesítési problémák](#hitelesítési-problémák)
  - [A `BETTER_AUTH_SECRET` az alapértelmezett placeholder értéken maradt](#a-better_auth_secret-az-alapértelmezett-placeholder-értéken-maradt)
  - [A `BETTER_AUTH_URL` nem egyezik az `APP_URL`-lel](#a-better_auth_url-nem-egyezik-az-app_url-lel)
  - [A Google-bejelentkezés nem működik](#a-google-bejelentkezés-nem-működik)
  - [A regisztráció le van tiltva, de még nincs admin felhasználó](#a-regisztráció-le-van-tiltva-de-még-nincs-admin-felhasználó)
- [Email nem működik](#email-nem-működik)
  - [Nem érkeznek emailek](#nem-érkeznek-emailek)
  - [SMTP hitelesítési hiba](#smtp-hitelesítési-hiba)
  - [Helytelen SMTP port / TLS eltérés](#helytelen-smtp-port--tls-eltérés)
  - [Az email-megerősítő link lejárt](#az-email-megerősítő-link-lejárt)
  - [A felhasználók nem tudnak bejelentkezni, mert email-megerősítés szükséges, de az email nincs konfigurálva](#a-felhasználók-nem-tudnak-bejelentkezni-mert-email-megerősítés-szükséges-de-az-email-nincs-konfigurálva)
- [A felhasználói felületen fordítási kulcsok jelennek meg szöveg helyett](#a-felhasználói-felületen-fordítási-kulcsok-jelennek-meg-szöveg-helyett)
- [403-as hiba remote hívásoknál](#403-as-hiba-remote-hívásoknál)
- [Docker-problémák](#docker-problémák)
  - [A `.env`-ben beállított `DATABASE_URL` felülírja a Docker Compose belső URL-jét](#a-env-ben-beállított-database_url-felülírja-a-docker-compose-belső-url-jét)
  - [A konténer folyamatosan újraindul](#a-konténer-folyamatosan-újraindul)
  - [A feltöltött fájlok eltűnnek a konténer újraindítása után](#a-feltöltött-fájlok-eltűnnek-a-konténer-újraindítása-után)
  - [Port-ütközés a PostgreSQL-lel](#port-ütközés-a-postgresql-lel)
- [Plugin rendszer problémái](#plugin-rendszer-problémái)
  - [A plugin feltöltése méretkorlát-hibával meghiúsul](#a-plugin-feltöltése-méretkorlát-hibával-meghiúsul)
  - [A plugin tárolási könyvtár nem írható](#a-plugin-tárolási-könyvtár-nem-írható)
  - [A fejlesztői pluginok nem töltődnek be](#a-fejlesztői-pluginok-nem-töltődnek-be)
  - [Az ütemezett feladat nem fut le](#az-ütemezett-feladat-nem-fut-le)
- [Naplózás és diagnosztika](#naplózás-és-diagnosztika)
  - [Nem jelenik meg napló](#nem-jelenik-meg-napló)
  - [A naplófájlok nem íródnak](#a-naplófájlok-nem-íródnak)
  - [Részletes naplózás engedélyezése hibakereséshez](#részletes-naplózás-engedélyezése-hibakereséshez)

---

## Az alkalmazás nem indul el

### Hiányzó kötelező környezeti változók

**Tünet:** Az alkalmazás indításkor összeomlik, hiányzó konfigurációra hivatkozó hibával.

**Ok:** A `DATABASE_URL`, `BETTER_AUTH_SECRET` vagy `BETTER_AUTH_URL` nincs beállítva.

**Megoldás:** Győződj meg róla, hogy a `.env` fájl legalább az alábbiakat tartalmazza:

```bash
DATABASE_URL=postgresql://racona:racona123@localhost:5432/racona
BETTER_AUTH_SECRET=<generálás: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
```

---

### A port már foglalt

**Tünet:** `Error: listen EADDRINUSE :::3000`

**Ok:** Egy másik folyamat már használja a 3000-es (vagy a konfigurált) portot.

**Megoldás:** Állítsd le az ütköző folyamatot, vagy változtasd meg a portot:

```bash
RACONA_PORT=3001
```

---

### `NODE_ENV` nincs beállítva

**Tünet:** Váratlan viselkedés, hiányzó funkciók vagy nem biztonságos alapértelmezések.

**Ok:** Ha `NODE_ENV` nincs megadva, az alkalmazás `development` módban fut. Éles környezetben ez teljesítmény- és biztonsági problémákat okozhat.

**Megoldás:** Éles környezetben mindig állítsd be: `NODE_ENV=production`.

---

## Adatbázis-problémák

### Nem lehet csatlakozni a PostgreSQL-hez

**Tünet:** `Connection refused` vagy `ECONNREFUSED` hiba indításkor.

**Ok:** A `DATABASE_URL`-ben megadott host/port nem érhető el.

**Gyakori hibák:**

- `localhost` használata hostként Docker-en belül (helyette a szolgáltatás neve: `postgres`)
- Rossz port (alapértelmezett: `5432`)
- A PostgreSQL konténer még nem állt fel, amikor az alkalmazás csatlakozni próbál

**Megoldás (lokális):**

```bash
DATABASE_URL=postgresql://racona:racona123@localhost:5432/racona
```

**Megoldás (Docker Compose):** Ne állítsd be a `DATABASE_URL`-t a `.env`-ben — a Docker Compose automatikusan összerakja a `POSTGRES_*` változókból, a belső `postgres` hostnévvel.

---

### Hitelesítési hiba az adatbázis-kapcsolatnál

**Tünet:** `password authentication failed for user "racona"`

**Ok:** A `.env`-ben lévő `POSTGRES_USER` / `POSTGRES_PASSWORD` nem egyezik azzal, amivel az adatbázis inicializálva lett.

**Megoldás:** Győződj meg róla, hogy a `POSTGRES_USER`, `POSTGRES_PASSWORD` és `POSTGRES_DB` értékei megegyeznek a kötet első létrehozásakor használt értékekkel. Ha a kötet létrehozása után változtattad meg őket, töröld a kötetet és indítsd újra:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

---

### Migrációk nem futottak le / hiányzó táblák

**Tünet:** `relation "..." does not exist` hibák.

**Ok:** Az adatbázis soha nem lett inicializálva, vagy a migrációk nem futottak le.

**Megoldás (Docker):** A `db-init` szolgáltatás automatikusan fut az első indításkor. Ha sikertelen volt, ellenőrizd a logjait:

```bash
docker logs racona-db-init
```

**Megoldás (lokális):**

```bash
bun db:init
```

Csak a migrációk újrafuttatásához (adatok törlése nélkül):

```bash
bun db:migrate
```

---

### A `db-init` konténer hibával lép ki

**Tünet:** A `racona` konténer soha nem indul el, mert a `db-init` nem fejeződött be sikeresen.

**Ok:** A migráció vagy a seed szkript hibával állt le — általában rossz `DATABASE_URL` vagy a postgres konténer nem volt még kész.

**Megoldás:** Ellenőrizd a logokat, és győződj meg róla, hogy a postgres szolgáltatás egészséges, mielőtt újrapróbálod:

```bash
docker logs racona-db-init
docker compose -f docker/docker-compose.yml up -d
```

---

## Hitelesítési problémák

### A `BETTER_AUTH_SECRET` az alapértelmezett placeholder értéken maradt

**Tünet:** A munkamenetek nem biztonságosak, vagy az auth tokenek érvénytelenek a telepítés után.

**Ok:** A `BETTER_AUTH_SECRET` értéke `your-secret-here` vagy `change-me-in-production` maradt.

**Megoldás:** Generálj megfelelő titkos kulcsot az első indítás előtt:

```bash
openssl rand -base64 32
```

> Ha ezt a kulcsot megváltoztatod miután felhasználók már bejelentkeztek, az összes meglévő munkamenet érvénytelenné válik.

---

### A `BETTER_AUTH_URL` nem egyezik az `APP_URL`-lel

**Tünet:** Az OAuth callback-ek meghiúsulnak, az email-megerősítő linkek hibásak, vagy a felhasználók rossz URL-re kerülnek átirányításra.

**Ok:** A `BETTER_AUTH_URL`-nek pontosan egyeznie kell az alkalmazás nyilvános URL-jével.

**Megoldás:** Mindkét értéknek azonosnak kell lennie:

```bash
APP_URL=https://racona.pelda.hu
BETTER_AUTH_URL=https://racona.pelda.hu
```

---

### A Google-bejelentkezés nem működik

**Tünet:** A Google-bejelentkezés gomb hiányzik, vagy hibát ad vissza.

**Ok:** A `SOCIAL_LOGIN_ENABLED` értéke `false`, vagy a `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` nincs beállítva.

**Megoldás:**

```bash
SOCIAL_LOGIN_ENABLED=true
GOOGLE_CLIENT_ID=az-te-client-id-d
GOOGLE_CLIENT_SECRET=az-te-client-secret-d
```

Győződj meg arról is, hogy a Google Cloud Console-ban az OAuth átirányítási URI be van állítva: `<APP_URL>/api/auth/callback/google`.

---

### A regisztráció le van tiltva, de még nincs admin felhasználó

**Tünet:** Senki nem tud bejelentkezni, és nincs lehetőség fiók létrehozására.

**Ok:** A `REGISTRATION_ENABLED=false` be lett állítva, mielőtt az első admin felhasználó létrejött volna.

**Megoldás:** Ideiglenesen engedélyezd újra a regisztrációt, hozd létre az admin fiókot, majd tiltsd le ismét. Alternatívaként állítsd be az `ADMIN_USER_EMAIL`-t a `bun db:init` futtatása előtt:

```bash
ADMIN_USER_EMAIL=admin@pelda.hu
```

Az alapértelmezett jelszó: **`Admin123.`** — az első bejelentkezés után azonnal változtasd meg. Ez kritikus fontosságú: az alapértelmezett jelszó megtartása komoly biztonsági kockázatot jelent.

---

## Email nem működik

### Nem érkeznek emailek

**Tünet:** A megerősítő emailek, OTP kódok vagy jelszó-visszaállító emailek soha nem érkeznek meg.

**Ok:** Az email-szolgáltató nincs megfelelően konfigurálva, vagy `EMAIL_TEST_MODE=true` van beállítva (az emailek csak a konzolra kerülnek naplózásra).

**Megoldás:** Először ellenőrizd az `EMAIL_TEST_MODE` értékét:

```bash
EMAIL_TEST_MODE=false
```

Ezután ellenőrizd, hogy a szolgáltatóspecifikus változók megfelelnek-e a kiválasztott `EMAIL_PROVIDER`-nek.

---

### SMTP hitelesítési hiba

**Tünet:** `535 Authentication failed` vagy hasonló SMTP hiba a logokban.

**Ok:** Helytelen `SMTP_USERNAME` / `SMTP_PASSWORD`, vagy az SMTP szerver alkalmazásspecifikus jelszót igényel (pl. Gmail).

**Megoldás:** Gmail esetén generálj [Alkalmazásjelszót](https://support.google.com/accounts/answer/185833) és azt add meg `SMTP_PASSWORD`-ként. Ehhez a Google-fiókon be kell kapcsolni a kétlépéses azonosítást.

---

### Helytelen SMTP port / TLS eltérés

**Tünet:** Kapcsolati időtúllépés vagy TLS kézfogási hiba.

**Ok:** Az `SMTP_PORT` és az `SMTP_SECURE` értékei nem illenek össze.

**Megoldás:**

| Port | `SMTP_SECURE` | Protokoll |
| ---- | ------------- | --------- |
| 587  | `false`       | STARTTLS  |
| 465  | `true`        | SSL/TLS   |
| 25   | `false`       | Sima      |

---

### Az email-megerősítő link lejárt

**Tünet:** A felhasználók rákattintanak a megerősítő linkre, de „lejárt" hibát kapnak.

**Ok:** Az `EMAIL_VERIFICATION_EXPIRES_IN` túl rövid, vagy az email késve érkezett meg.

**Megoldás:** Növeld a lejárati időt (másodpercben, max. 604800 = 7 nap):

```bash
EMAIL_VERIFICATION_EXPIRES_IN=172800  # 48 óra
```

---

### A felhasználók nem tudnak bejelentkezni, mert email-megerősítés szükséges, de az email nincs konfigurálva

**Tünet:** Az új felhasználók regisztrálnak, de soha nem tudják megerősíteni az emailjüket, mert nem érkezik levél.

**Ok:** `REQUIRE_EMAIL_VERIFICATION=true` van beállítva, de az email-szolgáltató még nincs konfigurálva.

**Megoldás (ideiglenes):** Tiltsd le a megerősítést az email beállítása közben:

```bash
REQUIRE_EMAIL_VERIFICATION=false
```

Vagy használd az `EMAIL_TEST_MODE=true` beállítást, és a tesztelés során másold ki a megerősítő linkeket a szerver logjaiból.

---

## A felhasználói felületen fordítási kulcsok jelennek meg szöveg helyett

**Tünet:** A bejelentkezési képernyőn (vagy az alkalmazás más részein) olvasható szöveg helyett nyers fordítási kulcsok látszanak — pl. `auth.login.title` a „Bejelentkezés" felirat helyett.

Ez az egyik legelső szembetűnő jel, hogy valami nincs rendben, mivel már a bejelentkezés előtt megjelenik.

**Ok 1: Hiányzó `ORIGIN` → 403-as hiba a fordítás-lekérdezéseknél**

A fordításbetöltő indításkor szerver-hívásokat intéz. Ha az `ORIGIN` nincs megfelelően beállítva, ezek a hívások `403 Forbidden` hibával térnek vissza, és a felhasználói felület nyers kulcsokat jelenít meg.

**Megoldás:** Állítsd be az `ORIGIN`-t az alkalmazás pontos nyilvános URL-jére:

```bash
ORIGIN=https://racona.pelda.hu
```

Ellenőrizd a böngésző Network fülét — ha a fordítás-lekérdezések `403`-at adnak vissza, ez az ok.

**Ok 2: Hiányzó fordítások az adatbázisban**

A fordítások a `platform.translations` táblában tárolódnak. Ha az adatbázis nem lett feltöltve (seed), vagy a seed hiányos volt, a tábla üres lesz és semmi szöveg nem töltődik be.

**Megoldás:** Futtasd a seed-et (vagy a teljes inicializálást) a fordítások feltöltéséhez:

```bash
# Lokális
bun db:seed

# Vagy teljes reset
bun db:init
```

Docker esetén indíts újra a kötet törlésével:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

A táblát közvetlenül is ellenőrizheted:

```sql
SELECT COUNT(*) FROM platform.translations;
```

Ha az eredmény `0`, a seed nem futott le.

---

## 403-as hiba remote hívásoknál

**Tünet:** A szerver akciók (űrlapbeküldések, adatmódosítások) `403 Forbidden` hibával térnek vissza.

**Ok:** Az `ORIGIN` változó nincs beállítva, vagy nem egyezik azzal az URL-lel, amelyről az alkalmazást elérik. A SvelteKit CSRF-védelme elutasítja azokat a kéréseket, amelyeknél az `Origin` fejléc nem egyezik.

**Megoldás:** Állítsd be az `ORIGIN`-t a pontos nyilvános URL-re:

```bash
ORIGIN=https://racona.pelda.hu
```

Ennek egyeznie kell a böngésző címsorában látható URL-lel — beleértve a protokollt és a portot, ha az nem szabványos.

---

## Docker-problémák

### A `.env`-ben beállított `DATABASE_URL` felülírja a Docker Compose belső URL-jét

**Tünet:** Az alkalmazás nem éri el az adatbázist Docker-en belül, pedig minden helyesnek tűnik.

**Ok:** Ha a `DATABASE_URL` a `.env`-ben `localhost`-ot tartalmaz hostként, az felülírja a Docker Compose által összerakott URL-t, amely a `postgres` szolgáltatásnevet használja.

**Megoldás:** Docker Compose használatakor kommenteld ki vagy töröld a `DATABASE_URL`-t a `.env`-ből. A compose fájl automatikusan beállítja:

```bash
# DATABASE_URL=postgresql://...  ← kommenteld ki Docker deploy esetén
```

---

### A konténer folyamatosan újraindul

**Tünet:** A `docker logs racona-app` ismétlődő indítási hibákat mutat.

**Ok:** Általában hiányzó környezeti változó, sikertelen adatbázis-kapcsolat, vagy a `db-init` szolgáltatás nem fejeződött be.

**Megoldás:**

1. Ellenőrizd a `db-init` logjait: `docker logs racona-db-init`
2. Ellenőrizd az alkalmazás logjait: `docker logs racona-app`
3. Győződj meg róla, hogy minden kötelező változó be van állítva a `.env`-ben

---

### A feltöltött fájlok eltűnnek a konténer újraindítása után

**Tünet:** A feltöltött fájlok eltűnnek, amikor a konténer újraindul.

**Ok:** Az `apps/web/uploads` könyvtár nincs kötetként csatolva.

**Megoldás:** Az alapértelmezett `docker-compose.yml` már tartalmazza a `../apps/web/uploads:/app/uploads` kötet-csatolást. Ha egyedi konfigurációt használsz, győződj meg róla, hogy ez a csatolás megvan.

---

### Port-ütközés a PostgreSQL-lel

**Tünet:** `bind: address already in use` a 5432-es porton.

**Ok:** A hoston már fut egy helyi PostgreSQL példány.

**Megoldás:** Változtasd meg a host oldali port-leképezést:

```bash
POSTGRES_PORT=5433
```

---

## Plugin rendszer problémái

### A plugin feltöltése méretkorlát-hibával meghiúsul

**Tünet:** A plugin feltöltése méretkorlát-hibával kerül elutasításra.

**Ok:** A plugin csomag meghaladja a `PLUGIN_MAX_SIZE` értékét (alapértelmezett: 10 MB).

**Megoldás:** Növeld a korlátot (max. 100 MB):

```bash
PLUGIN_MAX_SIZE=52428800  # 50 MB
```

---

### A plugin tárolási könyvtár nem írható

**Tünet:** A plugin telepítése jogosultsági hibával meghiúsul.

**Ok:** A folyamatnak nincs írási joga a `PLUGIN_STORAGE_DIR` vagy `PLUGIN_TEMP_DIR` könyvtárhoz.

**Megoldás:** Győződj meg róla, hogy a könyvtárak léteznek és az alkalmazás felhasználója írhatja őket:

```bash
mkdir -p /var/webos/plugins /tmp/webos-plugins
chmod 755 /var/webos/plugins
```

---

### A fejlesztői pluginok nem töltődnek be

**Tünet:** A `localhost` URL-ekről betöltött pluginok nem jelennek meg.

**Ok:** `DEV_MODE=false` (az alapértelmezett érték).

**Megoldás:** Engedélyezd a dev módot — csak fejlesztői környezetben:

```bash
DEV_MODE=true
```

> Éles környezetben soha ne állítsd be a `DEV_MODE=true` értéket.

---

### Az ütemezett feladat nem fut le

**Tünet:** Egy plugin ütemezett feladata nem fut le a várt időben, vagy a Plugin kezelő „Ütemezett feladatok” oldalán nincs friss futás.

**Ellenőrzés:**

1. Induláskor a naplóban szerepelnie kell a `[Scheduler] Started (...)` sornak. Ha `Disabled` áll ott, állítsd be: `SCHEDULER_ENABLED=true` (legalább egy példányon).
2. Az „Ütemezett feladatok” oldalon a feladat legyen bekapcsolva, és legyen „Következő futás” ideje. Inaktív, vagy `scheduler` jogosultság nélküli plugin feladata nem fut.
3. Az időpontok a feladat időzónájában értendők (alapból `SCHEDULER_DEFAULT_TIMEZONE`, `Europe/Budapest`).
4. Időtúllépés után a feladat az időkorlátja + 60 másodpercig zárolva marad.
5. Nézd meg a futásnaplót („Napló”): a sikertelen futásnál látszik a hiba és a feladat naplósorai. Három egymást követő hiba után a `plugin.scheduler.manage` jogosultsággal rendelkezők értesítést kapnak.

Az ütemezett futásnak nincs kérése, ezért az emailek linkje az `APP_URL`-ből jön — élesben állítsd be.

---

## Naplózás és diagnosztika

### Nem jelenik meg napló

**Tünet:** Az alkalmazás fut, de nem produkál naplókimenetet.

**Ok:** A `LOG_LEVEL` túl magasra van állítva (pl. `fatal`), vagy a `LOG_TARGETS` nem tartalmazza a `console` értéket.

**Megoldás:**

```bash
LOG_TARGETS=console
LOG_LEVEL=info
```

---

### A naplófájlok nem íródnak

**Tünet:** A `LOG_TARGETS=file` be van állítva, de nem jelennek meg fájlok a `LOG_DIR`-ben.

**Ok:** A naplókönyvtár nem létezik, vagy nem írható.

**Megoldás:** Hozd létre a könyvtárat és győződj meg róla, hogy írható:

```bash
mkdir -p ./logs
```

Vagy állíts be egyedi elérési utat:

```bash
LOG_DIR=/var/log/racona
```

---

### Részletes naplózás engedélyezése hibakereséshez

A maximális részletesség eléréséhez hibaelhárítás során:

```bash
LOG_TARGETS=console,file
LOG_LEVEL=debug
LOG_DIR=./logs
```

Ne felejtsd el visszaállítani a `LOG_LEVEL` értékét `info`-ra vagy `warn`-ra éles környezetben, hogy elkerüld a teljesítményromlást és a felesleges naplózajt.
