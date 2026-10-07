---
title: Általános alkalmazás felépítés
description: A Racona beépített rendszeralkalmazásainak általános felépítése és használata
sidebar:
  order: 1
---

A Racona beépített rendszeralkalmazásai (Beállítások, Felhasználók, Napló, Értesítések, stb.) egységes felépítést követnek, amely megkönnyíti a navigációt és a használatot. Ez az útmutató bemutatja ezeknek az alkalmazásoknak az általános struktúráját és működését.

> **Megjegyzés:** A Racona moduláris rendszer, amely lehetővé teszi egyedi alkalmazások és pluginek telepítését. Ezek az alkalmazások teljesen eltérő felépítéssel is rendelkezhetnek, saját felhasználói felülettel és működési logikával.
>
> Ugyanakkor ez az útmutató irányt mutat az egyéni alkalmazások tervezéséhez is. Ha követi ezt a felépítést, az alkalmazás zökkenőmentesen integrálódik a rendszerbe, egységes felhasználói élményt nyújt, és ráadásul rengeteg időt spórolhat - a core rendszer készen kapott komponenseit használhatja (oldalsáv, keresés, menükezelés, funkciósáv), így nem kell a nulláról felépíteni ezeket a funkciókat. Természetesen ha egyedi megoldásra van szükség, teljes szabadság áll rendelkezésre saját felület kialakítására.

## Általános felépítés

![Placeholder: Felhasználók alkalmazás felépítése](../../../../../assets/application/structure.webp)
_Felhasználók alkalmazás felépítése_

A beépített rendszeralkalmazások három fő részből állnak:

1. **Bal oldali oldalsáv** - Navigációs menü és keresés
2. **Jobb oldali tartalom terület** - Az aktív menüpont tartalma
3. **Funkciósáv** (opcionális) - Műveleti gombok a tartalom alatt

## Bal oldali oldalsáv

A bal oldali oldalsáv tartalmazza az alkalmazás navigációs menüjét és opcionálisan a keresési funkciót.

### Navigációs menü

A bal oldali oldalsáv tartalmazza az alkalmazás navigációs menüjét, amely hierarchikus struktúrában jeleníti meg az elérhető funkciókat.

**Menü jellemzők:**

- **Menüpontok**: Kattintható elemek, amelyek különböző nézeteket töltenek be
- **Almenük**: Egyes menüpontok további almenüket tartalmazhatnak (lenyitható/összecsukható)
- **Ikonok**: Minden menüpont rendelkezik egy ikonnal a könnyebb azonosításhoz
- **Aktív menüpont**: A jelenleg megnyitott menüpont kiemelten jelenik meg
- **Jogosultságok**: Csak azok a menüpontok láthatók, amelyekhez a felhasználónak jogosultsága van

**Példa menü struktúra (Felhasználók alkalmazás):**

```
👥 Felhasználók
🛡️ Hozzáférés Kezelés
  ├─ 👥 Csoportok
  ├─ 👑 Szerepkörök
  ├─ 🔑 Jogosultságok
  └─ 📦 Erőforrások
```

### Keresés a menüben

Egyes alkalmazások támogatják a keresést a menüben, amely megkönnyíti a kívánt funkció megtalálását nagy menüstruktúrák esetén.

**Keresés használata:**

1. Kattints a keresőmezőre az oldalsáv tetején
2. Kezdd el gépelni a keresett menüpont nevét
3. A menü automatikusan szűrődik a keresési kifejezés alapján
4. Kattints a kívánt menüpontra a megnyitásához

**Tipp:** A keresés figyelmen kívül hagyja a kis- és nagybetűket, és részleges egyezéseket is talál.

### Oldalsáv Összecsukása

Az oldalsáv összecsukható a jobb szélén található gombbal, amely több helyet biztosít a tartalom területnek.

**Működés:**

- Kattints az oldalsáv jobb szélén található nyíl gombra az összecsukáshoz
- Összecsukott állapotban a gomb balra mutató nyíllal jelenik meg
- Kattints újra a gombra az oldalsáv kibontásához
- Az oldalsáv állapota (összecsukva/kibontva) automatikusan mentésre kerül, így az alkalmazás újbóli megnyitásakor is megmarad

**Tipp:** Az oldalsáv összecsukása hasznos lehet kisebb képernyőkön vagy ha több helyre van szükséged a tartalom megtekintéséhez.

## Jobb oldali tartalom terület

A jobb oldali tartalom terület jeleníti meg az aktív menüpont tartalmát. A tartalom jellege teljesen az alkalmazás funkciójától függ - lehet egyszerű szöveges információ, komplex interaktív felület, vagy bármi más, amit az alkalmazás megkövetel.

**Gyakori tartalom típusok a beépített alkalmazásokban:**

- **Lista nézet**: Táblázatos adatmegjelenítés (pl. felhasználók listája)
- **Részletes nézet**: Egy elem részletes adatai (pl. felhasználó adatai)
- **Beállítási oldal**: Konfigurációs lehetőségek (pl. téma beállítások)
- **Űrlap**: Adatbeviteli felület (pl. új felhasználó létrehozása)
- **Egyéb**: Bármilyen egyedi tartalom, amit az alkalmazás igényel

### Címsor

A tartalom terület tetején található a címsor, amely tartalmazza:

- **Cím**: Az aktuális nézet neve (pl. "Felhasználók", "Beállítások")
- **Leírás**: Rövid leírás a nézet funkciójáról (opcionális)
- **Vissza gomb**: Részletes nézeteknél visszanavigálás a lista nézethez (opcionális)

## Funkciósáv

A funkciósáv a tartalom terület alján jelenik meg, és tartalmazza az aktuális nézethez kapcsolódó műveleteket.

**Funkciósáv jellemzők:**

- **Kontextusfüggő**: A gombok az aktuális nézethez és állapothoz igazodnak
- **Dinamikus**: A gombok megjelenése és funkciója változhat (pl. szerkesztési módban)
- **Ikonos gombok**: Minden gomb rendelkezik ikonnal és szöveges címkével

### Gyakori műveletek

**Megtekintési módban:**

- **Szerkesztés**: Szerkesztési mód aktiválása
- **Törlés**: Elem törlése (megerősítéssel)
- **Egyéb műveletek**: Alkalmazás-specifikus műveletek (pl. inaktiválás, exportálás)

**Szerkesztési módban:**

- **Mentés**: Változtatások mentése
- **Mégse**: Szerkesztés megszakítása, változtatások elvetése

**Példa: Felhasználó részletek funkciósáv**

Megtekintési módban:

- Szerkesztés gomb (ceruza ikon)
- Törlés gomb (piros, X ikon)
- Inaktiválás/Aktiválás gomb (tiltás/pipa ikon)

Szerkesztési módban:

- Mégse gomb (X ikon)
- Mentés gomb (pipa ikon)

## Szerkesztési mód

Sok alkalmazás támogatja az inline szerkesztést, amely lehetővé teszi az adatok módosítását anélkül, hogy külön szerkesztési oldalra kellene navigálni.

**Szerkesztési mód jellemzők:**

1. **Aktiválás**: Kattintson a "Szerkesztés" gombra a funkciósávon
2. **Mezők**: Az adatmezők szerkeszthető input mezőkké alakulnak
3. **Kapcsolódó adatok szerkesztése**: Badge-ek mellett megjelenik az eltávolítás gomb (X)
4. **Új elemek hozzáadása**: "+" gomb jelenik meg új elemek hozzáadásához (pl. új csoport hozzáadása)
5. **Mentés/Mégse**: A funkciósáv gombjai megváltoznak

**Példa: Felhasználó szerkesztése**

Szerkesztési módban:

- A név, email, felhasználónév mezők input mezőkké alakulnak
- A csoportok badge-ei mellett megjelenik az X gomb az eltávolításhoz
- Megjelenik a "+" gomb új csoport hozzáadásához
- A funkciósávon a "Mentés" és "Mégse" gombok jelennek meg

## Megerősítő dialógusok

Kritikus műveletek (törlés, inaktiválás) esetén megerősítő dialógus jelenik meg.

**Megerősítő dialógus jellemzők:**

- **Cím**: A művelet neve (pl. "Felhasználó inaktiválása")
- **Leírás**: Részletes leírás a műveletről és annak következményeiről
- **Megerősítés gomb**: A művelet végrehajtása (gyakran piros színű veszélyes műveleteknél)
- **Mégse gomb**: A művelet megszakítása

**Példa: Felhasználó inaktiválása**

```
Cím: Felhasználó inaktiválása
Leírás: Biztosan inaktiválni szeretné [Név] ([email]) felhasználót?
         Az inaktív felhasználók nem tudnak bejelentkezni a rendszerbe.
Gombok: [Mégse] [Inaktiválás]
```

## Értesítések (Toast)

A műveletek eredményéről toast értesítések tájékoztatnak.

**Értesítés típusok:**

- **Siker**: Zöld színű, pipa ikonnal (pl. "Felhasználó sikeresen mentve")
- **Hiba**: Piros színű, X ikonnal (pl. "Hiba történt a mentés során")
- **Figyelmeztetés**: Sárga színű, figyelmeztető ikonnal
- **Információ**: Kék színű, info ikonnal

**Értesítés jellemzők:**

- Automatikusan eltűnnek néhány másodperc után
- A jobb felső sarokban jelennek meg
- Több értesítés egymás alatt jelenik meg

## Jogosultságok

Az alkalmazások és menüpontok jogosultság-alapúak.

**Jogosultság kezelés:**

- **Menüpontok**: Csak azok a menüpontok láthatók, amelyekhez a felhasználónak jogosultsága van
- **Műveletek**: Egyes műveletek (pl. szerkesztés, törlés) csak megfelelő jogosultsággal érhetők el
- **Üres menü**: Ha egy alkalmazásban egyetlen menüponthoz sincs jogosultság, az alkalmazás nem jelenik meg

## Tippek és Trükkök

- **Gyors navigáció**: Használd a keresést a menüben nagy alkalmazások esetén
- **Szűrők kombinálása**: A lista nézetekben több szűrő is használható egyszerre
- **Rendezés**: Kattints az oszlop fejlécekre a rendezés megváltoztatásához
- **Szerkesztés megszakítása**: A "Mégse" gomb minden változtatást elvet
- **Jogosultságok**: Ha nem látsz egy menüpontot, kérj jogosultságot az adminisztrátortól

## Kapcsolódó témák

- [Alkalmazások áttekintése](/hu/user/applications/) - A Racona beépített alkalmazásai
- [Felhasználók](/hu/user/applications/users/) - Felhasználók kezelése
- [Beállítások](/hu/user/applications/settings/) - Rendszer beállítások
- [Napló](/hu/user/applications/log/) - Rendszer naplók
