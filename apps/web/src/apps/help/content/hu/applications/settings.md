---
title: Beállítások
description: A Beállítások alkalmazás részletes használata
sidebar:
  order: 2
---

A Beállítások alkalmazás a Racona központi konfigurációs központja. Itt testreszabhatja a rendszer megjelenését, viselkedését és funkcióit.

## Alapinformációk

- **Kategória**: Rendszer
- **Többpéldányos**: Nem
- **Jogosultság**: Publikus (minden felhasználó)

## Fiók

A Fiók menüpontban kezelheted személyes profilod adatait.

### Profilkép

- **Profilkép feltöltése**: Tölts fel saját profilképet (max. 5 MB, JPG, PNG, WebP formátum)
- **OAuth szinkronizáció**: Ha OAuth szolgáltatóval (pl. Google) jelentkeztél be, a profilkép automatikusan szinkronizálódik
- **Alapértelmezett avatar**: Ha nincs profilkép, a rendszer a nevedből generál kezdőbetűs avatart

### Személyes adatok

- **Név**: Teljes név szerkesztése (kötelező mező)
- **Felhasználónév**: Egyedi felhasználónév beállítása (opcionális)
- **E-mail cím**: E-mail cím megjelenítése (nem szerkeszthető)
- **Fiók típusa**: Megmutatja, hogy e-mail/jelszó vagy OAuth fiókkal rendelkezel

### Csoportok és szerepkörök

- **Csoportok**: A felhasználóhoz rendelt csoportok megjelenítése
- **Szerepkörök**: A felhasználóhoz rendelt szerepkörök megjelenítése
- **Létrehozás dátuma**: A fiók létrehozásának időpontja

**Tipp**: A Szerkesztés gombra kattintva módosíthatod adataidat, majd a Mentés gombbal véglegesítheted a változtatásokat.

## Biztonság

A Biztonság menüpontban kezelheted fiókod biztonsági beállításait.

### Kétfaktoros hitelesítés (2FA)

A kétfaktoros hitelesítés extra biztonsági réteget ad a fiókodhoz.

**2FA Bekapcsolása:**

1. Add meg jelenlegi jelszavadat
2. Kattints a "2FA Engedélyezése" gombra
3. Olvasd be a QR kódot egy hitelesítő alkalmazással (pl. Google Authenticator, Authy)
4. Add meg a hitelesítő alkalmazás által generált 6 jegyű kódot
5. Mentsd el a biztonsági mentési kódokat biztonságos helyre

**Biztonsági Mentési Kódok:**

- 10 darab egyszer használatos kód
- Használd őket, ha nincs hozzáférésed a hitelesítő alkalmazáshoz
- Másold vagy töltsd le őket biztonságos helyre
- Új kódokat generálhatsz bármikor

**2FA Kikapcsolása:**

1. Add meg jelenlegi jelszavadat
2. Kattints a "2FA Letiltása" gombra

### Jelszó módosítása

Módosítsd a fiókod jelszavát a biztonság érdekében.

1. **Jelenlegi jelszó**: Add meg aktuális jelszavadat
2. **Új jelszó**: Add meg az új jelszót (minimum 8 karakter)
3. **Jelszó megerősítése**: Írd be újra az új jelszót
4. Kattints a "Jelszó Módosítása" gombra

**Jelszó követelmények:**

- Minimum 8 karakter hosszú
- Tartalmaznia kell legalább egy nagybetűt (A-Z)
- Tartalmaznia kell legalább egy kisbetűt (a-z)
- Tartalmaznia kell legalább egy számot (0-9)
- Nem lehet azonos a jelenlegi jelszóval

## Megjelenés

A Megjelenés menüpontban testreszabhatod a Racona vizuális megjelenését.

### Téma előbeállítások

Válassz előre konfigurált téma előbeállítások közül, amelyek egyszerre állítják be a színsémát, témát és hátteret.

- **Előnézet**: Minden előbeállítás megjeleníti a téma módot, színsémát és hátteret
- **Gyors alkalmazás**: Egy kattintással alkalmazhatod a teljes témát

### Asztal téma

Válassz az asztal téma módjai között:

- **Világos**: Világos színsémával jeleníti meg a teljes rendszert (asztal, alkalmazások, felületi elemek)
- **Sötét**: Sötét színsémával jeleníti meg a teljes rendszert (asztal, alkalmazások, felületi elemek)
- **Automatikus**: A rendszer automatikusan vált világos és sötét téma között a napszak alapján

### Tálca téma

Válassz a tálca téma módjai között (függetlenül az asztal témától):

- **Világos**: Világos színsémával jeleníti meg a tálcát
- **Sötét**: Sötét színsémával jeleníti meg a tálcát
- **Automatikus**: A rendszer automatikusan vált világos és sötét téma között a napszak alapján

**Tipp**: A tálca témája függetlenül állítható be az asztal témától. Így például világos rendszeren használhatsz sötét tálcát, vagy fordítva, egyedi vizuális kontrasztot teremtve.

### Színséma

Az elsődleges szín határozza meg az alkalmazás kiemelő színét, amely megjelenik a gombokban, linkekben és más interaktív elemekben. Válassz egy előre definiált színt, vagy hozz létre egyedi színt az árnyalat csúszkával.

### Betűméret

Állítsd be a felület betűméretét az olvashatóság javítása érdekében.

**Tipp**: A betűméret beállítása hatással van az egész rendszer szövegeinek méretére. Nagyobb betűméret könnyebb olvashatóságot biztosít, míg kisebb betűméret több információt jelenít meg a képernyőn.

## Asztal

Az Asztal menüpontban az asztali környezet viselkedését állíthatod be.

### Megnyitási mód

Válassz az asztali parancsikonok megnyitási módjai között:

- **Egyszeres kattintás**: Egy kattintással nyitja meg az alkalmazásokat
- **Dupla kattintás**: Dupla kattintással nyitja meg az alkalmazásokat (hagyományos mód)

## Háttér

A Háttér menüpontban testreszabhatod az asztal hátterét.

### Háttér típusa

Válassz három háttér típus közül:

- **Szín**: Egyszínű háttér
- **Kép**: Háttérkép használata
- **Videó**: Videó háttér használata

### Szín háttér

Ha a Szín típust választod:

- **Színválasztó**: Válassz tetszőleges színt a színválasztó segítségével
- **Azonnali alkalmazás**: A kiválasztott szín azonnal alkalmazásra kerül

### Kép háttér

Ha a Kép típust választod:

**Rendszer Képek:**

- Előre telepített háttérképek közül választhatsz
- Miniatűr előnézetek segítik a választást

**Saját Kép Feltöltése:**

- Tölts fel saját háttérképet
- Támogatott formátumok: JPG, JPEG, PNG, WebP
- Maximum fájlméret: 10 MB
- Automatikus miniatűr generálás

**Feltöltött Képek Kezelése:**

- Megtekintheted az összes feltöltött képet
- Törölheted a nem használt képeket
- A törlés gomb a kép fölé húzva jelenik meg

**Képeffektek:**

- **Homályosítás**: 0-30 pixel közötti homályosítás alkalmazása (csúszkával állítható)
- **Szürkeárnyalatos**: A háttérkép fekete-fehérré alakítása

### Videó háttér

Ha a Videó típust választod:

- **Rendszer Videók**: Előre telepített videók közül választhatsz
- **Miniatűr előnézetek**: Minden videóhoz tartozik előnézeti kép
- **Támogatott formátumok**: MP4, WebM, OGG

**Megjegyzés**: A videó háttér erőforrás-igényes lehet, lassabb eszközökön érdemes képet vagy színt használni.

## Tálca

A Tálca menüpontban a tálca megjelenését és viselkedését állíthatod be.

### Pozíció

Válaszd ki a tálca pozícióját a képernyőn:

- **Felül**: A tálca a képernyő tetején jelenik meg
- **Alul**: A tálca a képernyő alján jelenik meg (alapértelmezett)

### Stílus

Válassz a tálca stílusai között:

- **Klasszikus**: Teljes szélességű tálca
- **Modern**: Lebegő, központosított tálca

### Tálca elemek láthatósága

Állítsd be, mely elemek jelenjenek meg a tálcán:

- **Óra**: Dátum és idő megjelenítése
- **Témaváltó**: Világos/sötét téma gyors váltása
- **Alkalmazás Link**: GUID hivatkozások megnyitása
- **Üzenetek**: Üzenetek alkalmazás gyors elérése
- **Értesítések**: Értesítési központ megnyitása

Minden elem mellett egy kapcsoló található, amellyel ki/be kapcsolhatod az adott elemet.

## Indító panel

Az Indító Panel menüpontban az alkalmazásindító megjelenését állíthatod be.

### Nézet mód

Válassz a két nézet mód között:

- **Rács nézet**: Az alkalmazások ikonokkal jelennek meg rács elrendezésben
- **Lista nézet**: Az alkalmazások lista formátumban jelennek meg részletes információkkal

## Teljesítmény

A Teljesítmény menüpontban optimalizálhatod a rendszer teljesítményét.

### Teljesítmény optimalizálás

- **Teljesítmény előnyben részesítése**: Kikapcsolja az erőforrás-igényes vizuális effekteket
- Ha be van kapcsolva, akkor az ablakok mozgatása közben csak a keret látszik, a tartalom nem jelenik meg
- Automatikusan letiltja az ablak előnézeteket és más vizuális funkciókat
- Jelentősen csökkenti a böngésző erőforrás-használatát, különösen lassabb eszközökön

### Ablak előnézetek

- **Előnézeti képek engedélyezése**: Az inaktív ablakok előnézeti képpel rendelkeznek a tálcán
- **Letiltás**: Gyorsabb működés, de nincs előnézet
- Csak akkor érhető el, ha a teljesítmény optimalizálás ki van kapcsolva

**Figyelem**: Az előnézeti képek erőforrás-igényesek és lassíthatják az alkalmazások minimalizálási idejét.

### Előnézeti kép mérete

Ha az ablak előnézetek engedélyezve vannak, beállíthatod az előnézeti képek méretét:

- **Kicsi** (100px): Legkisebb méret, leggyorsabb
- **Közepes** (150px): Kiegyensúlyozott méret (alapértelmezett)
- **Nagy** (200px): Legnagyobb méret, legjobb minőség

A csúszkán vizuális ikonok jelzik a méreteket.

## Nyelv

A Nyelv menüpontban a felület nyelvét állíthatod be.

### Felület nyelve

- **Nyelv választása**: Válassz a támogatott nyelvek közül
- **Azonnali alkalmazás**: A kiválasztott nyelv azonnal alkalmazásra kerül

**Jelenleg támogatott nyelvek:**

- Magyar (Hungarian)
- English (hamarosan)

**Megjegyzés**: Ez a menüpont csak akkor jelenik meg, ha több nyelv is elérhető a rendszerben.

## AI Asszisztens

Az AI Asszisztens menüpontban testreszabhatod az AI Asszisztens megjelenését és hang kimenetét. Az adminisztrátorok számára további beállítások is elérhetők az AI rendszer konfigurálásához.

### Avatar Beállítások

Az Avatar beállítások lehetővé teszik az AI Asszisztens vizuális megjelenésének testreszabását.

**Avatar kiválasztása:**

- Válassz a telepített avatarok közül
- Előnézet: Valós idejű előnézet a kiválasztott avatarról
- Minőség: SD (Standard Definition) vagy HD (High Definition)

**Megjegyzés**: Az új avatarok telepítése adminisztrátori jogosultságot igényel (lásd alább: Avatar Telepítés).

### TTS (Text-to-Speech) Beállítások

A TTS beállítások lehetővé teszik a hang kimenet testreszabását.

**Hang beállítások:**

- **Hang kiválasztása**: Válassz a rendelkezésre álló hangok közül
- **Sebesség**: Állítsd be a beszéd sebességét (0.5x - 2.0x)
- **Hangerő**: Állítsd be a hangerőt (0% - 100%)
- **Teszt**: Próbáld ki a beállításokat egy teszt mondattal

**Tipp**: A TTS beállítások teszteléséhez kattints a "Teszt" gombra (lejátszás ikon) az ablak alján.

**Megjegyzés**: A TTS szolgáltató konfigurálása adminisztrátori jogosultságot igényel (lásd alább: TTS Provider Konfiguráció).

### AI Agent Konfiguráció (csak admin)

Az AI Agent a rendszer központi AI motorja, amely lehetővé teszi az AI Asszisztens működését. Ez a menüpont csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el.

**AI Agent engedélyezése:**

- **Be**: Az AI Agent aktív, az AI Asszisztens használható
- **Ki**: Az AI Agent inaktív, az AI Asszisztens nem érhető el

**Konfiguráció:**

- **Provider**: Válassz AI szolgáltatót (OpenAI, Anthropic Claude, Google Gemini)
- **API Kulcs**: Add meg a szolgáltató API kulcsát
- **Model**: Add meg a használni kívánt modell nevét (pl. gpt-4, claude-3-opus)
- **Base URL**: Opcionális egyedi API végpont URL

**Haladó paraméterek:**

- **Max Tokens**: Maximum token szám a válaszokhoz (100 - 100,000)
- **Temperature**: Kreativitás szintje (0.0 - 2.0)
  - Alacsony érték (0.0-0.5): Konzisztens, kiszámítható válaszok
  - Közepes érték (0.5-1.0): Kiegyensúlyozott válaszok
  - Magas érték (1.0-2.0): Kreatív, változatos válaszok
- **Top P**: Válasz diverzitás (0.0 - 1.0)

**Tesztelés:**

- Kattints a "Kapcsolat Tesztelése" gombra az API konfiguráció ellenőrzéséhez
- Sikeres teszt esetén zöld jelzés jelenik meg

### TTS Provider Konfiguráció (csak admin)

A TTS (Text-to-Speech) Provider konfiguráció lehetővé teszi a hang kimenet szolgáltatójának beállítását. Ez a menüpont csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el.

**TTS Provider engedélyezése:**

- **Be**: A TTS szolgáltatás aktív, az AI hangosan is felolvassa a válaszokat
- **Ki**: A TTS szolgáltatás inaktív, csak szöveges válaszok

**Provider típusok:**

- **Browser Web Speech API**: Beépített böngésző TTS (ingyenes, korlátozott hangok)
- **ElevenLabs**: Professzionális TTS szolgáltatás (API kulcs szükséges)

**ElevenLabs konfiguráció:**

- **API Kulcs**: Add meg az ElevenLabs API kulcsát
- **Hangok betöltése**: Kattints a "Hangok Betöltése" gombra a rendelkezésre álló hangok listázásához
- **Hang kiválasztása**: Válassz a betöltött hangok közül
- **Nyelv**: Válaszd ki a kívánt nyelvet

**Tesztelés:**

- Kattints a "Hang Tesztelése" gombra a kiválasztott hang kipróbálásához
- A teszt hang automatikusan lejátszásra kerül

### Avatar Telepítés (csak admin)

Az Avatar Telepítés menüpont lehetővé teszi új avatarok feltöltését és telepítését a rendszerbe. Ez a menüpont csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el.

**Avatar feltöltése:**

1. Kattints a "Fájl kiválasztása" gombra
2. Válaszd ki a `.raconapkg` formátumú avatar csomagot
3. Kattints a "Telepítés" gombra
4. Várd meg a telepítés befejezését

**Telepített avatarok:**

- Megtekintheted az összes telepített avatart
- Minden avatar kártyán látható:
  - Avatar neve
  - Előnézeti kép
  - Elérhető minőségek (SD/HD)
  - Telepítés dátuma
- Kattints egy kártyára a részletek megtekintéséhez
- Törölheted a nem használt avatarokat (hamarosan)

**Megjegyzés**: Az avatar csomagnak `.raconapkg` formátumban kell lennie. Maximum fájlméret: 50 MB.

## Hitelesítés

A Hitelesítés menüpont csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el. Itt konfigurálhatók a rendszer hitelesítési beállításai.

### Regisztráció és Social Login

**Regisztráció engedélyezése:**

- **Be**: Új felhasználók regisztrálhatnak a rendszerbe
- **Ki**: Csak meghívott felhasználók jelentkezhetnek be

**Social Login engedélyezése:**

- **Be**: Felhasználók bejelentkezhetnek Google fiókkal
- **Ki**: Csak e-mail/jelszó bejelentkezés érhető el

## Rendszerinformáció

A Rendszerinformáció menüpontban megtekintheti a Racona verzióinformációit és kapcsolatfelvételi adatokat.

## Tippek és trükkök

- **Azonnali mentés**: A legtöbb beállítás azonnal érvénybe lép, nincs szükség külön mentésre
- **Alkalmazás megosztás**: A Beállítások alkalmazás megosztható GUID hivatkozással - így gyorsan navigálhatsz másokat egy adott beállításhoz
- **Gyors navigáció**: Használd a bal oldali menüt a különböző beállítási kategóriák között való gyors váltáshoz

## Gyakori kérdések

**Miért nem látom a Nyelv menüpontot?**
A Nyelv menüpont csak akkor jelenik meg, ha több nyelv is elérhető a rendszerben.

**Hogyan állíthatom vissza az alapértelmezett beállításokat?**
Jelenleg nincs "Visszaállítás" gomb, de minden beállítást manuálisan visszaállíthatsz az alapértelmezett értékre.

**Miért lassú a rendszer az ablak előnézetekkel?**
Az ablak előnézetek erőforrás-igényesek. Kapcsold ki őket a Teljesítmény menüpontban a gyorsabb működésért.

**Törölhetem a feltöltött háttérképeket?**
Igen, a saját feltöltött képeket törölheted a Háttér > Feltöltött Képek részben - a kép fölé húzva megjelenik a törlés gomb. A beépített rendszerképek nem törölhetők.

**Miért nem látom a Hitelesítés menüpontot?**
A Hitelesítés menüpont csak adminisztrátor jogosultsággal rendelkező felhasználók számára érhető el. Ez a menüpont a rendszer hitelesítési beállításait tartalmazza (regisztráció, social login).

**Miért nem látom az AI Agent Konfiguráció menüpontot?**
Az AI Agent Konfiguráció, TTS Provider Konfiguráció és Avatar Telepítés menüpontok az AI Asszisztens főmenüpont alatt találhatók, de csak adminisztrátor jogosultsággal rendelkező felhasználók számára láthatók.

**Hogyan engedélyezhetem az AI Asszisztenst?**
Az AI Asszisztens engedélyezéséhez adminisztrátori jogosultság szükséges. Az adminisztrátorok a Beállítások > AI Asszisztens > AI Agent Konfiguráció menüpontban engedélyezhetik és konfigurálhatják az AI Agent-et.

**Hol állíthatom be az AI Asszisztens avatarját?**
A felhasználók a Beállítások > AI Asszisztens > Avatar Beállítások menüpontban választhatnak a telepített avatarok közül. Az új avatarok telepítése adminisztrátori jogosultságot igényel (Beállítások > AI Asszisztens > Avatar Telepítés).

**Hol konfigurálhatom a TTS (hang kimenet) beállításokat?**
A felhasználók a Beállítások > AI Asszisztens > TTS Beállítások menüpontban állíthatják be a hang sebességét és hangerejét. A TTS szolgáltató (Browser Web Speech API vagy ElevenLabs) konfigurálása adminisztrátori jogosultságot igényel (Beállítások > AI Asszisztens > TTS Provider Konfiguráció).

**Milyen AI szolgáltatókat támogat a rendszer?**
A rendszer jelenleg három AI szolgáltatót támogat: OpenAI (GPT modellek), Anthropic (Claude modellek) és Google Gemini.

**Hogyan telepíthetek új avatart?**
Az új avatarok telepítése adminisztrátori jogosultságot igényel. Az adminisztrátorok a Beállítások > Hitelesítés > Avatar Telepítés menüpontban tölthetnek fel új avatarokat `.raconapkg` formátumban.

## Kapcsolódó Témák

- [Rendszer testreszabása](/hu/user/applications/settings/#megjelenés) - További testreszabási lehetőségek
- [A felület használata](/hu/user/desktop-basics/) - A Racona felületének alapjai
- [Felhasználók](/hu/user/applications/users/) - Felhasználók és jogosultságok kezelése
- [AI Asszisztens](/hu/user/applications/ai-assistant/) - AI Asszisztens használata és beállításai
