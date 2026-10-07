---
title: Felhasználók
description: A Felhasználók alkalmazás részletes használata
sidebar:
  order: 3
---

A Felhasználók alkalmazás lehetővé teszi a felhasználói fiókok kezelését, adminisztrációját és a különböző jogosultságok beállítását a Racona rendszerben.

## Alapinformációk

- **Kategória**: Rendszer
- **Többpéldányos**: Nem
- **Jogosultság**: Alapértelmezetten adminisztrátor csoport és szerepkör (tetszőlegesen módosítható)

## Hozzáférés

Ez az alkalmazás alapértelmezetten csak az adminisztrátor csoporthoz és szerepkörhöz rendelt felhasználók számára érhető el. Ez a beállítás tetszőlegesen módosítható a jogosultságkezelési rendszerben, így más csoportokhoz és szerepkörökhöz is hozzárendelhető az alkalmazás.

## Felhasználók

A Felhasználók menüpontban kezelheti a rendszerben regisztrált felhasználói fiókokat.

### Felhasználók listája

A főképernyőn látható az összes regisztrált felhasználó listája táblázatos formában. A lista a következő információkat tartalmazza:

- **Teljes név**: A felhasználó teljes neve
- **E-mail cím**: A felhasználó email címe
- **Felhasználónév**: Egyedi felhasználónév (ha be van állítva)
- **E-mail megerősítve**: Jelzi, hogy az email cím megerősítésre került-e
- **Regisztráció dátuma**: Mikor regisztrált a felhasználó
- **Állapot**: Aktív vagy inaktív
- **Provider**: Bejelentkezési mód (E-mail/jelszó, Google, Facebook, GitHub...stb)

### Keresés és szűrés

Gyorsan megtalálhatod a kívánt felhasználót:

- **Keresés**: Keress név vagy email cím alapján a keresőmezőben
- **Szűrés állapot szerint**: Szűrd a listát aktív vagy inaktív felhasználókra
- **Szűrők törlése**: Állítsd vissza az összes szűrőt az alapértelmezett állapotra

További információ a táblázatok kezeléséről: [Táblázatok használata](../components/tables.md) _(TODO: Ez a dokumentáció még nem készült el)_

### Felhasználó részletei

Kattintson a "Részletek" gombra a felhasználó sorának végén a részletes információk megtekintéséhez és szerkesztéséhez.

**Megtekinthető információk:**

- Személyes adatok (név, email, felhasználónév)
- Fiók típusa (E-mail/jelszó vagy OAuth)
- Fiók állapota (aktív/inaktív)
- Regisztráció dátuma
- Hozzárendelt csoportok
- Hozzárendelt szerepkörök

**Szerkesztési mód**: Az adatok szerkesztéséhez kattintson a "Szerkesztés" gombra az alsó funkciósávban. További információ az alkalmazások felépítéséről: [Alkalmazások felépítése](../app-structure.md) _(TODO: Ez a dokumentáció még nem készült el)_

### Csoportok kezelése

A felhasználó részletek oldalon megtekintheti és szerkesztési módban kezelheti a felhasználó csoporttagságait:

- **Csoportok megtekintése**: Mindig láthatja, mely csoportokhoz tartozik a felhasználó
- **Csoport hozzáadása** (szerkesztési módban): Kattintson a "Hozzáadás" gombra, keressen rá a csoportra, és adja hozzá
- **Csoport eltávolítása** (szerkesztési módban): Kattintson a csoport melletti törlés gombra az eltávolításhoz

### Szerepkörök kezelése

A felhasználó részletek oldalon megtekintheti és szerkesztési módban kezelheti a felhasználó szerepköreit:

- **Szerepkörök megtekintése**: Mindig láthatja, mely szerepkörökkel rendelkezik a felhasználó
- **Szerepkör hozzáadása** (szerkesztési módban): Kattintson a "Hozzáadás" gombra, keressen rá a szerepkörre, és rendelje hozzá
- **Szerepkör eltávolítása** (szerkesztési módban): Kattintson a szerepkör melletti törlés gombra az eltávolításhoz

### Felhasználó aktiválása/deaktiválása

Felhasználói fiók ideiglenes letiltása vagy újraaktiválása:

1. Nyisd meg a felhasználó részleteit
2. Kattints a "Felhasználó inaktiválása" vagy "Felhasználó aktiválása" gombra
3. Erősítsd meg a műveletet a megjelenő párbeszédablakban

**Megjegyzés**: A deaktivált felhasználók nem tudnak bejelentkezni a rendszerbe, de adataik megmaradnak. Az aktiválás után újra bejelentkezhetnek.

## Csoportok

A Csoportok menüpontban kezelheti a felhasználói csoportokat.

### Csoportok listája

A csoportok listája táblázatos formában jeleníti meg az összes definiált csoportot:

- **Csoport neve**: A csoport megnevezése
- **Leírás**: A csoport rövid leírása
- **Létrehozás dátuma**: Mikor hozták létre a csoportot

További információ a táblázatok kezeléséről: [Táblázatok használata](../components/tables.md) _(TODO: Ez a dokumentáció még nem készült el)_

### Új csoport létrehozása

Új csoport hozzáadásához:

1. Kattints az "Új csoport" gombra az alsó funkciósávban
2. Add meg a csoport nevét (kötelező)
3. Opcionálisan adj meg leírást
4. Kattints a "Létrehozás" gombra

Az új csoport azonnal megjelenik a listában, és megkezdheted a felhasználók, jogosultságok és alkalmazások hozzárendelését.

### Csoport részletei

Kattintson a "Részletek" gombra a csoport sorának végén a részletes információk megtekintéséhez.

**Megtekinthető információk:**

- Csoport neve és leírása (szerkesztési módban módosítható)
- Csoport tagjai (felhasználók listája)
- Csoporthoz rendelt jogosultságok
- Csoport számára elérhető alkalmazások

**Szerkesztési mód**: A csoport alapadatainak (név, leírás) szerkesztéséhez kattintson a "Szerkesztés" gombra az alsó funkciósávban. A felhasználók, jogosultságok és alkalmazások kezelése szerkesztési mód nélkül is elérhető.

### Felhasználók kezelése csoportban

A csoport részletek oldalon kezelheti a csoport tagjait:

- **Felhasználó hozzáadása**: Kattintson a "Felhasználó hozzáadása" gombra az alsó funkciósávban, válasszon felhasználót a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Felhasználó eltávolítása**: Kattintson a felhasználó melletti "Eltávolítás a csoportból" gombra a táblázatban

A felhasználók táblázatban láthatja a csoport összes tagját, beleértve a nevüket, email címüket és egyéb adataikat.

### Jogosultságok kezelése csoportban

A csoport részletek oldalon kezelheti a csoporthoz rendelt jogosultságokat:

- **Jogosultság hozzáadása**: Kattintson a "Jogosultság hozzáadása" gombra az alsó funkciósávban, válasszon jogosultságot a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Jogosultság eltávolítása**: Kattintson a jogosultság melletti "Eltávolítás a csoportból" gombra a táblázatban

A jogosultságok táblázatban láthatja a csoporthoz rendelt összes jogosultságot, beleértve a nevüket, leírásukat és az erőforrást, amelyre vonatkoznak.

### Alkalmazások kezelése csoportban

A csoport részletek oldalon kezelheti a csoport számára elérhető alkalmazásokat:

- **Alkalmazás hozzáadása**: Kattintson az "Alkalmazás hozzáadása" gombra az alsó funkciósávban, válasszon alkalmazást a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Alkalmazás eltávolítása**: Kattintson az alkalmazás melletti "Eltávolítás a csoportból" gombra a táblázatban
- **Alkalmazás megnyitása**: Kattintson a 3 függőleges pötty ikonra a sor végén, majd válassza a "Megnyitás" opciót az alkalmazás indításához

További információ a táblázat műveleti gombokról: [Táblázat műveletek](../components/table-actions.md) _(TODO: Ez a dokumentáció még nem készült el)_

Az alkalmazások táblázatban láthatja a csoport számára elérhető összes alkalmazást. Csak azok az alkalmazások jelennek meg a csoport tagjai számára az Indító Panelben, amelyek hozzá vannak rendelve a csoportjukhoz vagy szerepköreikhez.

**Fontos**: Az alkalmazások hozzáférése a csoportok és szerepkörök kombinációján alapul. Egy felhasználó akkor férhet hozzá egy alkalmazáshoz, ha legalább az egyik csoportja vagy szerepköre rendelkezik hozzáféréssel.

## Szerepkörök

A Szerepkörök menüpontban kezelheti a felhasználói szerepköröket.

### Szerepkörök listája

A szerepkörök listája táblázatos formában jeleníti meg az összes definiált szerepkört:

- **Szerepkör neve**: A szerepkör megnevezése
- **Leírás**: A szerepkör rövid leírása
- **Létrehozás dátuma**: Mikor hozták létre a szerepkört

További információ a táblázatok kezeléséről: [Táblázatok használata](../components/tables.md) _(TODO: Ez a dokumentáció még nem készült el)_

### Új szerepkör létrehozása

Új szerepkör hozzáadásához:

1. Kattints az "Új szerepkör" gombra az alsó funkciósávban
2. Add meg a szerepkör nevét (kötelező)
3. Opcionálisan adj meg leírást
4. Kattints a "Létrehozás" gombra

Az új szerepkör azonnal megjelenik a listában, és megkezdheted a jogosultságok, felhasználók és alkalmazások hozzárendelését.

### Szerepkör részletei

Kattintson a "Részletek" gombra a szerepkör sorának végén a részletes információk megtekintéséhez.

**Megtekinthető információk:**

- Szerepkör neve és leírása (szerkesztési módban módosítható)
- Szerepkörhöz rendelt jogosultságok
- Szerepkörrel rendelkező felhasználók (tagok)
- Szerepkör számára elérhető alkalmazások

**Szerkesztési mód**: A szerepkör alapadatainak (név, leírás) szerkesztéséhez kattintson a "Szerkesztés" gombra az alsó funkciósávban. A jogosultságok, felhasználók és alkalmazások kezelése szerkesztési mód nélkül is elérhető.

### Jogosultságok kezelése szerepkörben

A szerepkör részletek oldalon kezelheti a szerepkörhöz rendelt jogosultságokat:

- **Jogosultság hozzáadása**: Kattintson a "Jogosultság hozzáadása" gombra az alsó funkciósávban, válasszon jogosultságot a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Jogosultság eltávolítása**: Kattintson a jogosultság melletti "Eltávolítás a szerepkörből" gombra a táblázatban

A jogosultságok táblázatban láthatja a szerepkörhöz rendelt összes jogosultságot, beleértve a nevüket, leírásukat és az erőforrást, amelyre vonatkoznak.

### Felhasználók kezelése szerepkörben

A szerepkör részletek oldalon kezelheti a szerepkörrel rendelkező felhasználókat:

- **Felhasználó hozzáadása**: Kattintson a "Felhasználó hozzáadása" gombra az alsó funkciósávban, válasszon felhasználót a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Felhasználó eltávolítása**: Kattintson a felhasználó melletti "Eltávolítás a szerepkörből" gombra a táblázatban

A felhasználók táblázatban láthatja a szerepkörrel rendelkező összes felhasználót, beleértve a nevüket, email címüket és egyéb adataikat.

### Alkalmazások kezelése szerepkörben

A szerepkör részletek oldalon kezelheti a szerepkör számára elérhető alkalmazásokat:

- **Alkalmazás hozzáadása**: Kattintson az "Alkalmazás hozzáadása" gombra az alsó funkciósávban, válasszon alkalmazást a legördülő listából, és kattintson a "Hozzáadás" gombra
- **Alkalmazás eltávolítása**: Kattintson az alkalmazás melletti "Eltávolítás a szerepkörből" gombra a táblázatban
- **Alkalmazás megnyitása**: Kattintson a 3 függőleges pötty ikonra a sor végén, majd válassza a "Megnyitás" opciót az alkalmazás indításához

További információ a táblázat műveleti gombokról: [Táblázat műveletek](../components/table-actions.md) _(TODO: Ez a dokumentáció még nem készült el)_

Az alkalmazások táblázatban láthatja a szerepkör számára elérhető összes alkalmazást. Csak azok az alkalmazások jelennek meg a szerepkörrel rendelkező felhasználók számára az Indító Panelben, amelyek hozzá vannak rendelve a csoportjaikhoz vagy szerepköreikhez.

**Fontos**: Az alkalmazások hozzáférése a csoportok és szerepkörök kombinációján alapul. Egy felhasználó akkor férhet hozzá egy alkalmazáshoz, ha legalább az egyik csoportja vagy szerepköre rendelkezik hozzáféréssel.

## Jogosultságkezelési rendszer

A Racona rugalmas jogosultságkezelési rendszert használ, amely három szinten működik:

### Csoportok

- Felhasználók logikai csoportosítása (pl. Adminisztrátorok, Szerkesztők, Olvasók)
- Egy felhasználó több csoporthoz is tartozhat
- Csoportokhoz jogosultságok rendelhetők

### Szerepkörök

- Funkcionális szerepek definiálása (pl. Rendszergazda, Tartalomkezelő)
- Egy felhasználó több szerepkörrel is rendelkezhet
- Szerepkörökhöz jogosultságok rendelhetők

### Jogosultságok

- Konkrét műveletek engedélyezése (pl. felhasználók megtekintése, alkalmazások kezelése)
- Jogosultságok csoportokhoz és szerepkörökhöz rendelhetők
- Egy felhasználó jogosultságai a csoportjai és szerepkörei jogosultságainak összessége

**Példa**: Egy felhasználó az "Adminisztrátorok" csoportban van és "Rendszergazda" szerepkörrel rendelkezik. Mindkettőhöz különböző jogosultságok tartoznak, és a felhasználó mindkét forrásból származó jogosultságokkal rendelkezik.

## Biztonsági megfontolások

- Csak megbízható személyeknek adjon adminisztrátor jogosultságot
- Rendszeresen ellenőrizze az inaktív fiókokat
- Használja a csoportokat és szerepköröket a jogosultságok hatékony kezeléséhez
- Figyelje a felhasználói aktivitást a naplóalkalmazásban
- Deaktiválja a már nem használt felhasználói fiókokat a törlés helyett

## Tippek és trükkök

- **Gyors keresés**: Használd a keresőmezőt név vagy email alapján történő gyors szűréshez
- **Tömeges kezelés**: Csoportok és szerepkörök használatával egyszerre több felhasználó jogosultságait kezelheted
- **Átláthatóság**: A felhasználó részletek oldalon egy helyen láthatod az összes csoportot és szerepkört
- **Biztonság**: Deaktiválás helyett inkább távolítsd el a kritikus csoportokból és szerepkörökből a felhasználót

## Gyakori kérdések

**Ki férhet hozzá a Felhasználók alkalmazáshoz?**
Alapértelmezetten csak az adminisztrátor csoporthoz és szerepkörhöz rendelt felhasználók, de ez tetszőlegesen módosítható.

**Mi a különbség a csoport és a szerepkör között?**
A csoportok általában szervezeti egységeket reprezentálnak (pl. osztályok), míg a szerepkörök funkcionális feladatköröket (pl. szerkesztő, jóváhagyó). Mindkettőhöz jogosultságok rendelhetők.

**Törölhetek felhasználókat?**
Jelenleg a felhasználók deaktiválhatók, ami megakadályozza a bejelentkezést, de megőrzi az adatokat. A végleges törlés funkció fejlesztés alatt áll.

**Hogyan adhatok hozzá új csoportot vagy szerepkört?**
A Csoportok vagy Szerepkörök menüpontban kattints az "Új csoport" vagy "Új szerepkör" gombra az alsó funkciósávban. Add meg a nevet (kötelező) és opcionálisan a leírást, majd kattints a "Létrehozás" gombra. Az új csoport vagy szerepkör azonnal megjelenik a listában.

## Kapcsolódó témák

- [Beállítások](../settings) - Rendszerbeállítások kezelése
- [Napló](../log) - Rendszeresemények és felhasználói tevékenységek nyomon követése
- [Alkalmazások áttekintése](../) - A Racona alkalmazásainak áttekintése
