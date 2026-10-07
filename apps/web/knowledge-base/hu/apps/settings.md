---
title: Beállítások alkalmazás
category: apps
tags: [beállítások, konfiguráció, testreszabás, fiók, biztonság, megjelenés, asztal, háttér, tálca, teljesítmény, nyelv, rendszer]
aliases: [settings, konfiguráció, config, beállítás, személyre szabás, testreszabás]
last_updated: 2025-01-20
---

# Beállítások alkalmazás

## Rövid összefoglaló
A Beállítások alkalmazás a Racona rendszer központi konfigurációs központja. Itt kezelheted a fiókod, biztonsági beállításokat, megjelenést, asztali környezetet, teljesítményt és nyelvi beállításokat.

## Alkalmazás elérése
**Elérési út:** Indító menü → Beállítások
**Ikon:** Fogaskerék
**Gyorsbillentyű:** Nincs

## Főmenü struktúra

### 1. Fiók (Account)
**Elérési út:** Beállítások → Fiók

#### Profil beállítások
- **Profilkép kezelése**: Saját kép feltöltése vagy alapértelmezett használata
- **Személyes adatok**: Teljes név, felhasználónév, e-mail cím szerkesztése
- **Fiók típusa**: Google fiók vagy e-mail fiók megjelenítése
- **Csoportok és szerepkörök**: Hozzárendelt csoportok és szerepkörök megtekintése
- **Regisztráció dátuma**: Fiók létrehozásának időpontja

#### Validációs szabályok
- **Név**: Kötelező mező
- **Felhasználónév**: 3-50 karakter, csak betűk, számok és aláhúzás
- **E-mail**: Csak olvasható (külső szolgáltatótól szinkronizált)

### 2. Biztonság (Security)
**Elérési út:** Beállítások → Biztonság

#### Jelszó módosítása
- **Jelenlegi jelszó**: Megerősítés szükséges
- **Új jelszó**: Minimum 8 karakter
- **Jelszó megerősítése**: Egyezés ellenőrzése
- **Biztonsági követelmények**: Erős, egyedi jelszó használata ajánlott

#### Kétfaktoros hitelesítés (2FA)
- **Engedélyezés/letiltás**: Jelszóval történő megerősítés
- **QR kód**: Hitelesítő alkalmazással való beolvasás
- **Manuális beállítás**: Titkos kulcs kézi megadása
- **Ellenőrző kód**: 6 számjegyű TOTP kód
- **Tartalék kódok**: Egyszeri használatú mentési kódok
- **Tartalék kódok kezelése**: Újragenerálás, másolás, letöltés

### 3. Megjelenés (Appearance)
**Elérési út:** Beállítások → Megjelenés

#### Téma beállítások
- **Desktop téma mód**: Világos, sötét vagy automatikus
- **Taskbar téma mód**: Független téma a tálcának
- **Téma módok**:
  - Világos mód: Világos háttér, sötét szöveg
  - Sötét mód: Sötét háttér, világos szöveg
  - Automatikus: Rendszer beállítás követése

#### Színek
- **Elsődleges szín**: Alkalmazás kiemelő színe
- **Előre definiált színek**: Gyors kiválasztás
- **Egyéni szín**: Árnyalat csúszkával való beállítás
- **Alkalmazási területek**: Gombok, linkek, interaktív elemek

#### Betűméret
- **Rendszer betűméret**: Kicsi, közepes, nagy
- **Hatás**: Teljes rendszer szövegeinek mérete
- **Ajánlás**: Közepes méret az optimális olvashatósághoz

#### Témák (Presets)
- **Előre definiált témák**: Egy kattintásos alkalmazás
- **Téma komponensek**: Téma mód, szín, betűméret, háttér
- **Testreszabott beállítások**: Visszatérés egyéni konfigurációhoz

### 4. Asztal (Desktop)
**Elérési út:** Beállítások → Asztal

#### 4.1 Általános (General)
**Elérési út:** Beállítások → Asztal → Általános

##### Parancsikonok megnyitása
- **Egyszeres kattintás**: Gyorsabb hozzáférés
- **Dupla kattintás**: Véletlen megnyitás elkerülése
- **Ajánlás**: Felhasználói preferencia alapján

#### 4.2 Háttér (Background)
**Elérési út:** Beállítások → Asztal → Háttér

##### Háttér típusok
- **Szín**: Egyszínű háttér
- **Kép**: Statikus háttérkép
- **Videó**: Animált háttér (némítva, optimalizált)

##### Háttérszín beállítások
- **Előre definiált színek**: Gyors kiválasztás
- **Színválasztó**: Egyéni szín létrehozása
- **Azonnali alkalmazás**: Valós idejű előnézet

##### Háttérkép beállítások
- **Előre definiált képek**: Beépített háttérképek
- **Saját kép feltöltése**: Egyéni háttérkép
- **Támogatott formátumok**: JPG, PNG, WebP
- **Automatikus méretezés**: Képernyő mérethez igazítás
- **Kép kezelés**: Feltöltés, kiválasztás, törlés

##### Háttérvideó beállítások
- **Előre definiált videók**: Beépített animációk
- **Folyamatos ismétlés**: Végtelen loop
- **Némított lejátszás**: Hang nélküli működés
- **Teljesítmény optimalizálás**: Minimális rendszerterhelés

##### Vizuális effektek
- **Homályosítás (Blur)**: Beállítható intenzitás
- **Fekete-fehér (Grayscale)**: Szürkeárnyalatos megjelenítés
- **Kombinálható effektek**: Blur + grayscale együttes használat

#### 4.3 Tálca (Taskbar)
**Elérési út:** Beállítások → Asztal → Tálca

##### Pozíció beállítások
- **Felül**: Képernyő tetején
- **Alul**: Képernyő alján (alapértelmezett)
- **Navigációs előnyök**: Kényelmesebb elérés

##### Stílus beállítások
- **Klasszikus**: Teljes képernyő szélességű
- **Lebegő**: Margókkal és lekerekített sarkokkal
- **Megjelenési különbségek**: Csak vizuális, funkcionalitás azonos

##### Tálca elemei
- **Óra**: Aktuális idő megjelenítése
- **Témaváltó**: Világos/sötét téma kapcsoló
- **Alkalmazás megnyitó**: GUID alapú alkalmazás indítás
- **Üzenetek**: Chat üzenetek gyors elérése
- **Értesítések**: Rendszer értesítések
- **Elem kezelés**: Be/kikapcsolás egyenként

#### 4.4 Indító panel (Start Panel)
**Elérési út:** Beállítások → Asztal → Indító panel

##### Megjelenítési módok
- **Ikon nézet**: Rácsos elrendezés ikonokkal
- **Lista nézet**: Részletes információk soronként
- **Választási szempontok**: Személyes preferencia és használati szokások

### 5. Teljesítmény (Performance)
**Elérési út:** Beállítások → Teljesítmény

#### Teljesítmény optimalizálás
- **Gyorsabb működés**: Vizuális effektek csökkentése
- **Ablak mozgatás**: Tartalom elrejtése mozgatás közben
- **Ablak előnézet**: Letiltás lassabb eszközökön
- **Célcsoport**: Gyengébb hardverű eszközök

#### Ablak előnézet
- **Funkció**: Előnézeti képek a tálcán
- **Működés**: Hover effekt az alkalmazás ikonokon
- **Előnyök**: Könnyebb navigáció nyitott ablakok között
- **Teljesítmény**: Memória és CPU igény

#### Előnézeti kép méret
- **Kicsi**: Minimális erőforrás igény
- **Közepes**: Ajánlott beállítás
- **Nagy**: Részletesebb előnézet
- **Hatalmas**: Maximum részletesség, nagy erőforrás igény

### 6. Nyelv és régió (Language)
**Elérési út:** Beállítások → Nyelv és régió
**Feltétel**: Csak többnyelvű rendszerekben jelenik meg

#### Nyelv kiválasztása
- **Elérhető nyelvek**: Rendszerben telepített nyelvek
- **Azonnali hatás**: Változtatás után azonnal érvénybe lép
- **Teljes rendszer**: Minden szöveg érintett
- **Felhasználói felület**: Menük, gombok, üzenetek

### 7. Névjegy (About)
**Elérési út:** Beállítások → Névjegy

#### Rendszer információk
- **Verzió**: Aktuális Racona verzió
- **Leírás**: "Modern webes asztali környezet a hatékony munkavégzéshez"
- **Verzió előzmények**: Changelog elérése
- **Szerzői jogok**: © 2025 Racona

## Gyakori műveletek

### Beállítások mentése
1. Módosítsd a kívánt beállítást
2. A rendszer automatikusan menti a változtatásokat
3. Megerősítő üzenet jelenik meg sikeres mentés esetén

### Beállítások visszaállítása
- Egyes beállításoknál "Visszaállítás" gomb elérhető
- Alapértelmezett értékekre való visszatérés
- Megerősítés szükséges a visszaállítás előtt

### Hibaelhárítás

#### Beállítások nem mentődnek
- **Ellenőrizd**: Megfelelő jogosultságok
- **Próbáld**: Oldal frissítése és újrapróbálkozás
- **Hiba esetén**: Rendszergazda értesítése

#### Téma nem változik
- **Várakozás**: Néhány másodperc a változás érvénybe lépéséhez
- **Cache törlés**: Böngésző cache ürítése
- **Újratöltés**: Oldal frissítése

#### 2FA problémák
- **Időszinkron**: Eszköz órájának ellenőrzése
- **Tartalék kódok**: Mentési kódok használata
- **Újra beállítás**: 2FA letiltása és újra engedélyezése

#### Háttérkép nem jelenik meg
- **Fájlformátum**: Támogatott formátum ellenőrzése (JPG, PNG, WebP)
- **Fájlméret**: Túl nagy fájlok problémát okozhatnak
- **Böngésző cache**: Cache törlése és újrapróbálkozás

## Biztonsági megjegyzések

### Jelszó biztonság
- Használj erős, egyedi jelszót
- Ne használd ugyanazt a jelszót más szolgáltatásoknál
- Rendszeresen változtasd meg a jelszavad

### 2FA ajánlások
- Mindig engedélyezd a kétfaktoros hitelesítést
- Mentsd el a tartalék kódokat biztonságos helyre
- Használj megbízható hitelesítő alkalmazást (Google Authenticator, Authy)

### Profil adatok
- Csak valós adatokat adj meg
- Rendszeresen ellenőrizd a profil információkat
- Jelentsd a gyanús tevékenységeket