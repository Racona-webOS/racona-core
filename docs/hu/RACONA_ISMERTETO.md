# Racona — Termékismertető

> Miért válassza a Racona platformot a következő belső rendszer alapjaként?

---

## Mi a Racona?

A Racona egy modern, böngészőalapú operációs rendszer, amely teljes asztali élményt nyújt — telepítés nélkül, bármilyen eszközről, bármilyen böngészőből elérhető.

Nem egy újabb webalkalmazás. Egy **platform**, amelyre bármilyen üzleti logika ráépíthető, és amelynek infrastrukturális alapjai (autentikáció, jogosultságkezelés, értesítések, chat, fájlkezelés, naplózás) már készen állnak.

---

## A fejlesztő cég szemszögéből

### Drasztikusan rövidebb fejlesztési idő

Egy hagyományos belső vállalati rendszer felépítésekor az idő jelentős részét az infrastruktúra viszi el:

- autentikáció, 2FA, jelszó-visszaállítás
- jogosultságkezelés, szerepkörök, csoportok
- értesítési rendszer
- belső chat
- naplózás, hibakövetés
- email küldés sablonokkal
- többnyelvűség (i18n)
- deployment infrastruktúra

A Raconában mindez **kész**. A fejlesztő csak azt írja meg, ami az adott ügyfélnek specifikusan kell — egy plugint.

Egy hasonló platform nulláról: 3–6 hónap.
Egy Racona plugin megírása: hetek.

### Plugin alapú bővíthetőség

Minden ügyfélspecifikus funkció önálló pluginként épül a rendszerre. Ez azt jelenti:

- az alap rendszer stabil marad, nem kell minden projektnél újraírni
- az ügyfél később bármikor kérhet új funkciókat, anélkül hogy az egész rendszert érintené
- akár a megrendelő saját fejlesztői is bővíthetik a rendszert a `@racona/sdk` segítségével

### Egységes, karbantartható alap

Minden projekt ugyanarra a tesztelt, karbantartott alapra épül. Nincs "minden projektnél más auth megoldás" probléma. A hibajavítások és fejlesztések az alap rendszerben automatikusan minden projektnél érvényesülnek.

### Self-hostolható, egy paranccsal

```bash
docker compose up
```

Ennyi. Az ügyfél saját szerverén fut, saját adatbázissal, teljes adatkontrollal.

---

## A megrendelő szemszögéből

### Egységes munkakörnyezet

A felhasználók egyetlen felületen érik el az összes eszközüket. Nem kell tabokat váltogatni, nem veszítik el a kontextust, minden egységesen viselkedik.

Ez különösen értékes olyan felhasználóknak, akik **egész nap a rendszerben dolgoznak** — back office, diszpécser, ügyfélszolgálat, adminisztráció.

### Valós idejű kommunikáció beépítve

A beépített chat és értesítési rendszer nem egy külső eszköz — a munkafolyamat szerves része. Az értesítések azonnal megjelennek, a csapat kommunikációja egy helyen zajlik.

### Szerepkör alapú hozzáférés

Pontosan szabályozható, hogy ki mit lát és mit tehet. Adminok, felhasználók, csoportok — a jogosultságkezelés részletes és rugalmas.

### Biztonság

- Kétfaktoros hitelesítés (TOTP)
- Eszköz megbízhatóság kezelése
- Egyszerre csak egy aktív munkamenet felhasználónként
- Rate limiting, CSRF védelem
- Teljes audit napló

### Többnyelvűség

A rendszer futás közben váltható nyelven működik, az adatbázis-alapú fordítási rendszernek köszönhetően. Multinacionális környezetben is azonnal bevethető.

### Adatok az ügyfélnél maradnak

Self-hosted megoldás — az adatok nem kerülnek harmadik fél szerverére. Teljes adatszuverenitás.

---

## Beépített funkciók

| Funkció            | Leírás                                                         |
| ------------------ | -------------------------------------------------------------- |
| Ablakkezelés       | Drag, resize, minimize, maximize, snap — valódi asztali élmény |
| Tálca & Start menü | Testreszabható, kereshető, rácsos vagy listás nézet            |
| Asztali ikonok     | Drag-and-drop elrendezés, jobb klikk menü                      |
| Beépített Chat     | Valós idejű belső üzenetküldés                                 |
| Értesítések        | Rendszerértesítések, előzmények                                |
| Felhasználókezelés | Fiókok, csoportok, szerepkörök (admin)                         |
| Plugin Manager     | Pluginek feltöltése és telepítése (admin)                      |
| Beállítások        | Megjelenés, biztonság, nyelv, asztal konfiguráció              |
| Naplózó            | Rendszer- és hibanaplók szűrhetően                             |
| Súgó               | Beépített dokumentáció böngésző                                |

---

## Mikor érdemes Raconát választani?

✅ Belső vállalati platform, ahol a felhasználók egész nap a rendszerben dolgoznak
✅ Több különböző funkciót kell egyszerre elérhetővé tenni
✅ Fontos a biztonság és a részletes jogosultságkezelés
✅ Az ügyfél saját szerveren szeretné üzemeltetni
✅ A jövőben várható bővítési igény
✅ Gyors leszállítási határidő

❌ Egyszerű, alkalmi használatú webalkalmazás (ott elég egy hagyományos megoldás)
❌ Publikus, marketing jellegű weboldal

---

## Tech stack (röviden)

| Réteg          | Technológia                                       |
| -------------- | ------------------------------------------------- |
| Frontend       | SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4 |
| Backend        | SvelteKit server, Express + Socket.IO             |
| Adatbázis      | PostgreSQL, Drizzle ORM                           |
| Auth           | better-auth (email, OTP, Google, 2FA)             |
| Runtime        | Bun                                               |
| Infrastruktúra | Docker + Docker Compose                           |

Modern, aktívan fejlesztett technológiák — nem legacy stack.

---

## Összefoglalás

A Racona nem egy újabb webalkalmazás sablon. Egy kész platform, amely:

- **fejlesztőként** hónapokat spórol meg projektenként
- **megrendelőként** egységes, biztonságos, bővíthető munkakörnyezetet ad
- **felhasználóként** egy ismerős, asztali élményt nyújt — telepítés nélkül, bárhonnan

> Az alap infrastruktúra kész. Csak azt kell megírni, ami az ügyfélnek valóban kell.
