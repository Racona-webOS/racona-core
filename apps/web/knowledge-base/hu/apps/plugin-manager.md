---
title: Plugin Manager alkalmazás
category: apps
tags: [plugin, alkalmazás, telepítés, bővítmény, store, feltöltés, kezelés, fejlesztői, manuális]
aliases: [alkalmazás kezelő, app manager, bővítmény kezelő, plugin kezelő, alkalmazás telepítő]
last_updated: 2025-01-20
---

# Plugin Manager alkalmazás

## Rövid összefoglaló
A Plugin Manager a Racona rendszer alkalmazás- és bővítménykezelő központja. Itt telepíthetsz új alkalmazásokat, kezelheted a meglévőket, és fejlesztői módban tesztelhetsz helyi pluginokat.

## Alkalmazás elérése
**Elérési út:** Indító menü → Plugin Manager
**Ikon:** Csomag/Package
**Jogosultság:** Egyes funkciók adminisztrátori jogot igényelnek

## Főmenü struktúra

### 1. Elérhető alkalmazások (Store)
**Elérési út:** Plugin Manager → Elérhető alkalmazások
**Állapot:** Fejlesztés alatt

#### Funkciók (tervezett)
- **Alkalmazások böngészése**: Külső alkalmazások felfedezése
- **Egyszerű telepítés**: Egy kattintásos telepítési folyamat
- **Kategóriák**: Alkalmazások rendszerezése típus szerint
- **Keresés és szűrés**: Gyors alkalmazás keresés

#### Jelenlegi állapot
- **"Hamarosan elérhető"** üzenet
- **Alternatíva**: Manuális telepítés funkció használata
- **Fejlesztési terv**: Külső alkalmazás store implementálása

### 2. Telepített alkalmazások (Installed)
**Elérési út:** Plugin Manager → Telepített alkalmazások

#### Alkalmazás lista
- **Oszlopok**:
  - **Név**: Alkalmazás megjelenített neve
  - **Verzió**: Telepített verzió száma
  - **Szerző**: Alkalmazás fejlesztője
  - **Állapot**: Aktív/Inaktív
  - **Telepítve**: Telepítés dátuma és ideje

#### Szűrési lehetőségek
- **Keresés**: Név alapján való keresés
- **Állapot szűrés**: Aktív/inaktív alkalmazások
- **Szűrők törlése**: Összes szűrő visszaállítása

#### Alkalmazás műveletek
- **Részletek megtekintése**: Teljes alkalmazás információ
- **Eltávolítás**: Alkalmazás törlése a rendszerből

### 3. Manuális telepítés (Manual Install)
**Elérési út:** Plugin Manager → Manuális telepítés
**Jogosultság:** `plugin.manual.install` engedély szükséges

#### Feltöltési folyamat
1. **Fájl kiválasztása**: .raconapkg vagy .zip fájl
2. **Drag & Drop**: Húzd a fájlt a feltöltési területre
3. **Tallózás**: Vagy kattints a "Fájl tallózása" gombra
4. **Validáció**: Automatikus fájl és tartalom ellenőrzés
5. **Telepítés**: "Alkalmazás feltöltése" gomb megnyomása

#### Támogatott fájlformátumok
- **.raconapkg**: Racona natív csomag formátum
- **.zip**: Tömörített alkalmazás csomag
- **Méret limit**: Rendszergazda által beállított maximum

#### Validációs ellenőrzések
- **Fájl integritás**: ZIP struktúra ellenőrzése
- **Manifest.json**: Kötelező konfigurációs fájl
- **Plugin ID egyediség**: Duplikáció elkerülése
- **Biztonsági scan**: Veszélyes kódminták keresése
- **Függőségek**: Engedélyezett csomagok ellenőrzése

### 4. Fejlesztői pluginok (Dev Plugins)
**Elérési út:** Plugin Manager → Fejlesztői pluginok
**Jogosultság:** `plugin.manual.install` engedély + fejlesztői mód
**Feltétel:** Csak fejlesztői módban látható

#### Fejlesztői plugin betöltő
- **Cél**: Helyi fejlesztői szerver tesztelése
- **URL megadás**: Fejlesztői szerver címe (pl. http://localhost:5174)
- **Valós idejű tesztelés**: Kód változások azonnali tesztelése
- **Hot reload**: Automatikus frissítés kód módosításkor

#### Használati útmutató
1. **Plugin build**: `npm run build` vagy hasonló
2. **Dev szerver indítás**: `npm run dev` vagy `yarn dev`
3. **URL megadás**: Szerver cím beírása (pl. localhost:5174)
4. **Betöltés**: "Betöltés" gomb megnyomása
5. **Tesztelés**: Plugin funkciók kipróbálása

#### Docker környezet
- **Host mapping**: `host.docker.internal` használata localhost helyett
- **Port forwarding**: Megfelelő port konfigurálás
- **Hálózati beállítások**: Docker bridge network figyelembevétele

## Alkalmazás részletek nézet

### Alapvető információk
- **Plugin azonosító**: Egyedi ID a rendszerben
- **Verzió**: Telepített verzió szám
- **Szerző**: Fejlesztő neve/szervezete
- **Leírás**: Alkalmazás funkcionalitásának ismertetése
- **Kategória**: Alkalmazás típusa/csoportja
- **Minimum Racona verzió**: Kompatibilitási követelmény

### Rendszer információk
- **Telepítés dátuma**: Első telepítés időpontja
- **Frissítés dátuma**: Utolsó módosítás időpontja
- **Állapot**: Aktív vagy inaktív
- **Fájl méret**: Alkalmazás csomag mérete

### Engedélyek
- **Használt engedélyek**: Alkalmazás által igényelt jogosultságok
- **Engedély leírások**: Mit tesz lehetővé az egyes engedély
- **Biztonsági információ**: Adatvédelmi vonatkozások

### Függőségek
- **Külső csomagok**: Szükséges third-party könyvtárak
- **Verzió követelmények**: Minimális csomag verziók
- **Kompatibilitás**: Rendszer követelmények

## Alkalmazás eltávolítás

### Eltávolítási folyamat
1. **Alkalmazás kiválasztása**: Telepített alkalmazások listából
2. **Részletek megnyitása**: "Részletek" gomb megnyomása
3. **Eltávolítás gomb**: "Alkalmazás eltávolítása" opció
4. **Megerősítés**: Biztonsági kérdés elfogadása
5. **Törlés végrehajtása**: Végleges eltávolítás

### Megerősítési dialog
- **Figyelmeztetés**: "Ez a művelet nem vonható vissza"
- **Alkalmazás név**: Egyértelmű azonosítás
- **Következmények**: Adatvesztés lehetősége
- **Gombok**: "Eltávolítás" vagy "Mégse"

## Hibaelhárítás

### Telepítési hibák

#### Érvénytelen fájlformátum
- **Ok**: Nem támogatott fájltípus
- **Megoldás**: Csak .raconapkg vagy .zip fájlokat használj
- **Ellenőrzés**: Fájlkiterjesztés és MIME típus

#### Fájl túl nagy
- **Ok**: Méret limit túllépése
- **Megoldás**: Kisebb fájl használata vagy limit növelése
- **Rendszergazda**: Méret limit beállítás módosítása

#### Hiányzó manifest.json
- **Ok**: Kötelező konfigurációs fájl hiányzik
- **Megoldás**: Manifest fájl hozzáadása a csomaghoz
- **Tartalom**: Plugin metaadatok és beállítások

#### Duplikált plugin ID
- **Ok**: Már létezik ugyanilyen azonosítójú alkalmazás
- **Megoldás**: Plugin ID módosítása vagy meglévő eltávolítása
- **Egyediség**: Minden plugin egyedi azonosítóval kell rendelkezzen

#### Veszélyes kódminta
- **Ok**: Biztonsági scan talált problémás kódot
- **Megoldás**: Kód átnézése és tisztítása
- **Példák**: eval(), innerHTML, külső script betöltés

#### Nem engedélyezett függőség
- **Ok**: Tiltott külső csomag használata
- **Megoldás**: Engedélyezett alternatíva keresése
- **Whitelist**: Rendszergazda által jóváhagyott csomagok

### Fejlesztői plugin hibák

#### Kapcsolódási hiba
- **Ok**: Fejlesztői szerver nem elérhető
- **Ellenőrzés**: Szerver fut-e a megadott címen
- **Megoldás**: Szerver újraindítása vagy URL javítása

#### CORS hiba
- **Ok**: Cross-Origin Resource Sharing blokkolás
- **Megoldás**: CORS beállítások engedélyezése a dev szerverben
- **Konfiguráció**: Vite/Webpack CORS beállítások

#### Manifest betöltési hiba
- **Ok**: Hibás vagy hiányzó manifest.json
- **Megoldás**: Manifest fájl javítása
- **Validáció**: JSON szintaxis és kötelező mezők

## Biztonsági megfontolások

### Alkalmazás telepítés
- **Csak megbízható forrásból**: Ismeretlen alkalmazások kerülése
- **Engedélyek átnézése**: Mit kér az alkalmazás
- **Rendszeres frissítés**: Biztonsági javítások telepítése

### Fejlesztői mód
- **Csak fejlesztési célra**: Éles rendszerben kerülendő
- **Helyi hálózat**: Csak belső IP címek használata
- **Tűzfal beállítások**: Külső hozzáférés korlátozása

### Adatvédelem
- **Alkalmazás engedélyek**: Mit ér el az alkalmazás
- **Adatgyűjtés**: Milyen információkat tárol
- **Külső kapcsolatok**: Hálózati kommunikáció ellenőrzése

## Fejlesztői információk

### Plugin csomag struktúra
```
plugin.zip/
├── manifest.json          # Kötelező metaadatok
├── index.html            # Főoldal (opcionális)
├── main.js              # Belépési pont
├── style.css            # Stílusok
├── assets/              # Statikus fájlok
└── locales/             # Fordítások
```

### Manifest.json példa
```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "author": "Developer Name",
  "description": "Plugin leírása",
  "minRaconaVersion": "1.0.0",
  "permissions": ["storage", "notifications"],
  "dependencies": {
    "lodash": "^4.17.21"
  }
}
```

### Engedélyezett függőségek
- **Utility könyvtárak**: lodash, ramda, date-fns
- **UI komponensek**: Racona SDK komponensek
- **Adatkezelés**: Racona storage API
- **Tiltott**: eval, innerHTML, külső script betöltés