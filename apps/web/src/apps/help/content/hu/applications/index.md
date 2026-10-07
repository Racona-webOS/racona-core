---
title: Áttekintés
description: A Racona beépített alkalmazásainak használata
sidebar:
  order: 0
  label: Áttekintés
---

## A Racona alkalmazás filozófiája

A Racona egy modern webOS rendszer, amely alapértelmezetten tartalmazza azokat az alapvető alkalmazásokat, amelyek egy működőképes operációs rendszer működéséhez elengedhetetlenek. Ezek az alapalkalmazások biztosítják a rendszer magfunkcióit: felhasználók kezelése, kommunikáció (üzenetek), értesítési rendszer, rendszerbeállítások, naplózás és súgó.

Ez a kiindulási pont egy stabil, használatra kész alapot nyújt, amelyet később az Alkalmazásbolt segítségével telepíthető alkalmazásokkal bővíthet egyedi felhasználói igények szerint. Lehetőség van manuálisan is, egyedi fejlesztésű alkalmazásokkal bővíteni a rendszert - ezek az alkalmazások a webOS által biztosított SDK segítségével elérik a magfunkciókat és tökéletesen integrálódnak a rendszerbe. Így a Racona rugalmasan alakítható különböző használati esetekhez - legyen szó vállalati környezetről, orvosi rendelő vagy kórházi rendszerről, vagy egyéni projektről.

## Alkalmazások felépítése

A Racona beépített rendszeralkalmazásai (Beállítások, Felhasználók, Napló, stb.) egységes felépítést követnek: bal oldali navigációs menü, jobb oldali tartalom terület, és opcionális funkciósáv a műveleti gombokkal. Ez a konzisztens struktúra megkönnyíti a rendszeralkalmazások használatát.

Fontos megjegyezni, hogy a Racona moduláris rendszer - a telepíthető alkalmazások és pluginek teljesen egyedi felépítéssel is rendelkezhetnek, saját felhasználói felülettel és működési logikával.

[Részletes útmutató az általános alkalmazás felépítésről →](./structure)

## Alkalmazások indítása

Alkalmazásokat többféleképpen indíthatsz:

- **Asztali parancsikonok**: Kattints az alkalmazás ikonjára az asztalon (egy vagy dupla kattintással, a beállításoktól függően)
- **Indító Panel**: Nyisd meg az Indító Panelt a tálcán, és válaszd ki a kívánt alkalmazást
- **Keresés**: Kezdd el gépelni az Indító Panelben az alkalmazás nevét
- **GUID hivatkozás**: Használd az Alkalmazás Megnyitó funkciót a tálcán megosztott hivatkozások megnyitásához

## Alkalmazás kategóriák

A Racona alkalmazásai kategóriákba vannak rendezve a könnyebb navigáció érdekében:

- **Rendszer**: Alapvető rendszer alkalmazások (Beállítások, Felhasználók, Napló, Alkalmazásbolt)
- **Kommunikáció**: Kommunikációs eszközök (Üzenetek)
- **Segédprogramok**: Hasznos segédeszközök (Súgó, Értesítések)

## Többpéldányos alkalmazások

Egyes alkalmazások többpéldányos módban futhatnak, ami azt jelenti, hogy ugyanabból az alkalmazásból több ablakot is megnyithat egyidejűleg:

- **Súgó**: Több súgó ablakot nyithat meg különböző témákhoz
- **Napló**: Több napló ablakot nyithat meg különböző szűrésekkel

A legtöbb alkalmazás azonban egypéldányos, ami azt jelenti, hogy csak egy ablak lehet nyitva belőlük. Ha megpróbálja újra megnyitni egy már futó egypéldányos alkalmazást, a meglévő ablak kerül előtérbe.

## Alkalmazás jogosultságok

Az alkalmazások hozzáférése rugalmasan szabályozható:

- **Publikus alkalmazások**: Minden bejelentkezett felhasználó számára elérhetők
- **Korlátozott alkalmazások**: Tetszőlegesen csoportokhoz és szerepkörökhöz rendelhetők igény szerint

Az alapértelmezett beállítások szerint a Felhasználók és az Alkalmazásbolt alkalmazások adminisztrátor csoporthoz és szerepkörhöz vannak rendelve. A felhasználók csak azokat az alkalmazásokat látják, amelyekhez jogosultsággal rendelkeznek.

További információ a jogosultságkezelésről: [Felhasználók alkalmazás - Jogosultságok](/hu/user/applications/users/#jogosultságok)

## Rendszer alkalmazások

### Beállítások

**Kategória**: Rendszer | **Többpéldányos**: Nem

A Beállítások alkalmazás a rendszer központi konfigurációs központja. Itt testreszabhatja a Racona megjelenését, viselkedését és funkcióit.

**Főbb funkciók:**

- **Fiók**: Profil szerkesztése (név, felhasználónév, profilkép), csoportok és szerepkörök megtekintése
- **Biztonság**: Kétfaktoros hitelesítés (2FA) beállítása, jelszó módosítása, biztonsági mentési kódok
- **Megjelenés**: Téma előbeállítások, asztal és tálca téma (világos/sötét/automatikus), színséma, betűméret
- **Asztal**: Asztali parancsikonok megnyitási módja (egy/dupla kattintás)
- **Háttér**: Háttérkép, videó vagy szín beállítása
- **Tálca**: Pozíció, tálca elemeinek láthatósága (óra, alkalmazás gombok, stb.)
- **Indító Panel**: Nézet (rács/lista), keresési beállítások
- **Teljesítmény**: Rendszer teljesítményének optimalizálása
- **Nyelv**: Felület nyelve (ha több nyelv elérhető)
- **AI Asszisztens**: Avatar és TTS (Text-to-Speech) beállítások
- **Hitelesítés**: Regisztráció, social login, AI Agent és TTS Provider konfiguráció (csak admin)
- **Rendszerinformáció**: Verzió és rendszer adatok

[Részletes használati útmutató →](/hu/user/applications/settings/)

### Felhasználók

**Kategória**: Rendszer | **Többpéldányos**: Nem | **Jogosultság**: Admin

A Felhasználók alkalmazás lehetővé teszi a felhasználói fiókok kezelését, adminisztrációját és a különböző jogosultságok beállítását.

**Főbb funkciók:**

- Felhasználói fiókok megtekintése és szerkesztése
- Új felhasználók létrehozása
- Felhasználói jogosultságok, csoportok és szerepkörök kezelése
- Fiókok aktiválása/deaktiválása
- Felhasználói adatok módosítása

**Megjegyzés**: Ez az alkalmazás csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el.

[Részletes használati útmutató →](/hu/user/applications/users/)

### Napló

**Kategória**: Rendszer | **Többpéldányos**: Nem

A Napló alkalmazás megjeleníti a rendszer naplóit és hibaüzeneteket.

**Főbb funkciók:**

- Rendszer naplók megtekintése
- Hibaüzenetek és figyelmeztetések
- Aktivitási napló
- Szűrési és keresési lehetőségek
- Napló exportálása

**Tipp**: Ha problémát tapasztal a rendszerben, először nézze meg a Napló alkalmazást a részletes hibaüzenetekért.

[Részletes használati útmutató →](/hu/user/applications/log/)

### Alkalmazásbolt

**Kategória**: Rendszer | **Többpéldányos**: Nem | **Jogosultság**: Admin

Az Alkalmazásbolt (Plugin Manager) lehetővé teszi új alkalmazások feltöltését és telepítését a Racona rendszerbe.

**Főbb funkciók:**

- Alkalmazások feltöltése
- Alkalmazások telepítése
- Telepített alkalmazások kezelése
- Alkalmazás frissítések
- Alkalmazás eltávolítása

**Megjegyzés**: Ez az alkalmazás csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el.

## Kommunikációs alkalmazások

### Üzenetek (Chat)

**Kategória**: Kommunikáció | **Többpéldányos**: Nem

Az Üzenetek alkalmazás egy belső üzenetküldő rendszer, amely lehetővé teszi a kommunikációt más felhasználókkal.

**Főbb funkciók:**

- Valós idejű üzenetküldés
- Beszélgetések kezelése

**Tipp**: Az Üzenetek alkalmazás ideális a gyors csapatmunkához és kollaborációhoz.

[Részletes használati útmutató →](/hu/user/applications/chat/)

## Segédprogram alkalmazások

### AI Asszisztens

**Kategória**: Segédprogramok | **Többpéldányos**: Nem

Az AI Asszisztens egy intelligens virtuális asszisztens, amely segít a mindennapi feladatok elvégzésében, kérdések megválaszolásában és a rendszer használatában.

**Főbb funkciók:**

- Valós idejű beszélgetés az AI-val
- Kontextus megértés és többnyelvű támogatás
- Avatar testreszabása
- TTS (Text-to-Speech) hang kimenet
- Gyors hozzáférés a tálcáról

**Tipp**: Az AI Asszisztens chat panel a tálcán található ikonra kattintva nyitható meg gyors hozzáféréshez.

[Részletes használati útmutató →](/hu/user/applications/ai-assistant/)

### Térkép

**Kategória**: Segédprogramok | **Többpéldányos**: Igen

A Térkép alkalmazás egy interaktív térképnézegető és útvonaltervező, amely OpenStreetMap adatokon alapul.

**Főbb funkciók:**

- Helyek keresése a térképen
- Útvonaltervezés autóval, gyalog vagy kerékpárral
- Aktuális tartózkodási hely használata indulásként
- Fizetős utak, autópályák és kompok kerülése
- Távolság és menetidő megjelenítése

[Részletes használati útmutató →](/hu/user/applications/map/)

### Súgó

**Kategória**: Segédprogramok | **Többpéldányos**: Igen

A Súgó alkalmazás a rendszer dokumentációját és felhasználói útmutatókat tartalmazza.

**Főbb funkciók:**

- Rendszer dokumentáció böngészése
- Felhasználói útmutatók
- Alkalmazás-specifikus súgók
- Keresési funkció
- Kontextusfüggő segítség

[Részletes használati útmutató →](/hu/user/applications/help/)

### Értesítések

**Kategória**: Segédprogramok | **Többpéldányos**: Nem

Az Értesítések alkalmazás az összes értesítését egy helyen jeleníti meg.

**Főbb funkciók:**

- Összes értesítés megtekintése
- Értesítések szűrése (olvasott/olvasatlan, kritikus)
- Értesítések törlése
- Értesítési előzmények
- Értesítési beállítások gyors elérése

[Részletes használati útmutató →](/hu/user/applications/notifications/)

## Alkalmazás megosztás

A Racona lehetővé teszi alkalmazások megosztását más felhasználókkal GUID hivatkozások segítségével:

1. Nyisd meg az alkalmazást a kívánt állapotban (pl. egy adott beállítási oldalon)
2. Kattints a Link gombra az ablak címsorában (türkiz gomb)
3. A hivatkozás automatikusan a vágólapra kerül
4. Küldd el a hivatkozást a másik felhasználónak
5. A másik felhasználó az Alkalmazás Megnyitó funkcióval (tálca jobb alsó sarka) megnyithatja az alkalmazást ugyanabban az állapotban

További információ: [A felület használata - Link Gomb](/hu/user/desktop-basics/windows/#link-gomb-alkalmazás-megosztás)

## Alkalmazás súgó

Egyes alkalmazások rendelkeznek beépített súgó funkcióval. Ha látja a súgó gombot az ablak címsorában (kék gomb, ? ikon), kattintson rá a kontextusfüggő súgó megnyitásához. A Súgó alkalmazás automatikusan megnyílik az adott alkalmazás dokumentációjával.

## Következő lépések

- [A felület használata](/hu/user/desktop-basics/) - Ablakkezelés, tálca, indító panel
- [Rendszer testreszabása](/hu/user/applications/settings/#megjelenés) - Témák, háttér, nyelv beállítások
- [Gyakori kérdések](/hu/user/faq/) - Válaszok a gyakori kérdésekre
