---
title: Értesítések
description: Az értesítések alkalmazás és értesítési rendszer részletes használata
sidebar:
  order: 5
---

A Racona értesítési rendszere központosított módon kezeli az összes rendszer- és alkalmazás értesítést. Az értesítések öt különböző módon jelennek meg: felugró értesítésként (toast), kritikus értesítések esetén modal ablakban, az Értesítési Központ panelben, az Értesítések alkalmazásban, és a tálca értesítési ikonján.

## Alapinformációk

- **Kategória**: Segédprogramok
- **Többpéldányos**: Nem
- **Jogosultság**: Publikus (minden felhasználó)

## Az értesítési rendszer működése

A Racona értesítési rendszere öt fő komponensből áll:

### Felugró értesítések (Toast)

Amikor új értesítés érkezik, a képernyő jobb felső sarkában megjelenik egy felugró értesítés:

- **Pozíció**: Jobb felső sarok
- **Időtartam**: 5 másodperc (automatikusan eltűnik)
- **Típusok szerint színezve**:
  - Info: Kék
  - Success: Zöld
  - Warning: Sárga
  - Error: Piros
- **Tartalom**: Cím és üzenet
- **Bezárás**: X gombbal vagy automatikusan

**Fontos**: A kritikus típusú értesítések NEM jelennek meg toast formában, hanem modal ablakban (lásd lent).

### Kritikus értesítések modális ablaka

A kritikus értesítések külön kezelést kapnak, mivel azonnali figyelmet igényelnek:

- **Megjelenés**: Modal ablak (párbeszédablak) a képernyő közepén
- **Blokkoló**: Nem lehet bezárni X gombbal, csak az OK gombbal
- **Felhasználói interakció szükséges**: A felhasználónak el kell olvasnia és az OK gombra kell kattintania
- **Ikon**: Piros figyelmeztető háromszög
- **Tartalom**: Cím, üzenet és opcionális részletek

**Miért fontos ez?** A kritikus értesítések olyan eseményeket jeleznek, amelyeket a felhasználónak mindenképpen észre kell vennie. Például egy kórházi rendszerben egy új sürgős eset érkezéséről, vagy egy rendőrségi rendszerben egy sürgős bejelentésről szóló értesítés.

**Példa használati esetek:**

- Kórházi rendszer: Új sürgősségi eset érkezett
- Rendőrségi rendszer: Sürgős bejelentés érkezett
- Ipari rendszer: Kritikus hiba vagy biztonsági esemény

### Értesítési központ panel

A tálca értesítési ikonjára kattintva megnyílik az Értesítési Központ panel:

- **Pozíció**: A képernyő jobb oldalán nyílik meg
- **Tartalom**: Az utolsó értesítések listája időrendi sorrendben
- **Gyors műveletek**: Frissítés, összes olvasva, összes törlése, bezárás

![Placeholder: Értesítési Központ panel](../../../../../assets/application/notification.webp)
_Az Értesítési Központ panel_

### Tálca értesítési ikon

A tálca jobb oldalán található csengő ikon jelzi az értesítések állapotát:

- **Alapállapot**: Csak a csengő ikon látható
- **Olvasatlan értesítések**: Piros jelvény az olvasatlan értesítések számával (maximum 99+)
- **Kritikus értesítés**: Sárga jelvény felkiáltójellel, amely pulzál
- **Kombinált**: Mindkét jelvény egyszerre is megjelenhet

### Értesítések alkalmazás

A teljes értesítési előzmények megtekintésére szolgáló alkalmazás:

- **Táblázatos megjelenítés**: Minden értesítés részletes adatokkal
- **Lapozás és rendezés**: Nagy mennyiségű értesítés kezelése
- **Részletes nézet**: Egyedi értesítés teljes információi

## Értesítési típusok

A Racona különböző típusú értesítéseket támogat, amelyek vizuálisan is megkülönböztethetők:

### Információs

Általános információs értesítések kék ikonnal:

- Rendszer információk
- Alkalmazás események
- Általános üzenetek

### Sikeres

Sikeres műveletek zöld ikonnal:

- Sikeres mentések
- Befejezett folyamatok
- Pozitív visszajelzések

### Figyelmeztetés

Figyelmet igénylő események sárga ikonnal:

- Figyelmeztetések
- Fontos információk
- Közelgő határidők

### Hiba/Kritikus

Hibák és kritikus események piros ikonnal:

- Rendszer hibák
- Biztonsági figyelmeztetések
- Kritikus események

**Kritikus értesítések**: A kritikus típusú értesítések sárga felkiáltójellel jelennek meg a tálca ikonján, és pulzálnak a figyelemfelkeltés érdekében.

## Értesítési központ panel

### Panel megnyitása

A tálca jobb oldalán található csengő ikonra kattintva nyílik meg az Értesítési Központ panel.

### Panel felépítése

**Fejléc:**

- **Cím**: "Értesítések"
- **Frissítés gomb**: Az értesítések listájának frissítése
- **Összes olvasva gomb**: Minden értesítés olvasottá jelölése (csak ha van olvasatlan)
- **Összes törlése gomb**: Minden értesítés törlése (csak ha van értesítés)
- **Bezárás gomb**: A panel bezárása

**Értesítések listája:**

Minden értesítés a következő információkat tartalmazza:

- **Típus ikon**: Színes ikon a típus szerint (info, success, warning, error)
- **Alkalmazás neve**: Kék jelvényben, kattintható (megnyitja az értesítést küldő alkalmazást, pl. Chat, Settings stb.)
- **Cím**: Az értesítés címe
- **Olvasatlan jelző**: Kék pont az olvasatlan értesítéseknél
- **Időbélyeg**: Relatív időformátumban (pl. "2 perce", "1 órája")
- **Üzenet**: Az értesítés teljes szövege
- **Részletek gomb**: Megnyitja az Értesítések alkalmazást az adott értesítés részletes nézetével

**Hover műveletek:**

Amikor az egérmutatót egy értesítés fölé viszi, megjelennek a gyors műveletek:

- **Olvasottá tétel**: Kék pipa ikon (csak olvasatlan értesítéseknél)
- **Törlés**: Piros kuka ikon

### Panel működése

- **Automatikus bezárás**: A panelen kívülre kattintva automatikusan bezáródik
- **Animáció**: Becsúszó animációval jelenik meg
- **Görgetés**: Ha sok értesítés van, a lista görgethető
- **Üres állapot**: Ha nincs értesítés, egy csengő ikon és "Nincsenek értesítések" szöveg jelenik meg

## Értesítések alkalmazás

### Alkalmazás megnyitása

Az Értesítések alkalmazást a következő módokon nyithatod meg:

- **Indító Panel**: Az Indító Panelből az Értesítések alkalmazás ikonra kattintva
- **Asztali ikon**: Ha az Értesítések alkalmazás ikonja ki van téve az asztalra, arra kattintva
- **Részletek gomb**: Az Értesítési Központ panelben egy értesítés "Részletek" gombjára kattintva (megnyitja az Értesítések alkalmazást az adott értesítés részletes nézetével)

**Megjegyzés**: Az Értesítési Központ panelben az alkalmazás nevére (kék jelvény) kattintva NEM az Értesítések alkalmazás nyílik meg, hanem az értesítést küldő alkalmazás (pl. ha egy chat értesítésre kattint, a Chat alkalmazás nyílik meg).

### Értesítések listája

Az alkalmazás főképernyőjén táblázatos formában jelennek meg az értesítések:

**Táblázat oszlopai:**

- **Típus**: Az értesítés típusa (info, success, warning, error/critical)
- **Cím**: Az értesítés címe
- **Üzenet**: Az értesítés szövege
- **Alkalmazás**: Melyik alkalmazástól származik
- **Létrehozva**: Mikor érkezett az értesítés

**Táblázat funkciók:**

- **Rendezés**: Bármelyik oszlop szerint rendezhető
- **Lapozás**: 20 értesítés oldalanként
- **Részletek gomb**: A sor végén található gomb megnyitja az értesítés részleteit

**Műveletek (3 pötty ikon):**

- **Olvasottá tétel**: Az értesítés olvasottá jelölése (csak olvasatlan értesítéseknél)
- **Törlés**: Az értesítés törlése

### Értesítés részletei

Egy értesítés részletes nézetében a következő információk láthatók:

- **Cím**: Az értesítés címe
- **Üzenet**: A teljes üzenet szöveg
- **Részletek**: További információk (ha vannak)
- **Típus**: Az értesítés típusa
- **Alkalmazás**: Forrás alkalmazás
- **Állapot**: Olvasott vagy olvasatlan
- **Létrehozva**: Létrehozás időpontja
- **Olvasva**: Olvasás időpontja (ha már olvasott)

**Műveletek az alsó funkciósávban:**

- **Olvasottá tétel**: Az értesítés olvasottá jelölése (csak olvasatlan értesítéseknél)
- **Alkalmazás megnyitása**: A forrás alkalmazás megnyitása (ha van)
- **Törlés**: Az értesítés törlése (megerősítést kér)

## Értesítések kezelése

### Olvasottá jelölés

**Értesítési Központ panelben:**

- **Automatikus**: Egy értesítésre kattintva (alkalmazás név vagy részletek gomb) automatikusan olvasottá válik
- **Manuális**: Hover állapotban a kék pipa ikonra kattintva
- **Összes**: A fejlécben az "Összes olvasva" gombra kattintva

**Értesítések alkalmazásban:**

- **Egyenként**: A 3 pötty ikon alatt az "Olvasottá tétel" opcióval
- **Részletek nézetben**: Az alsó funkciósávban az "Olvasottá tétel" gombbal

### Törlés

**Értesítési Központ panelben:**

- **Egyenként**: Hover állapotban a piros kuka ikonra kattintva
- **Összes**: A fejlécben az "Összes törlése" gombra kattintva

**Értesítések alkalmazásban:**

- **Egyenként**: A 3 pötty ikon alatt a "Törlés" opcióval
- **Részletek nézetben**: Az alsó funkciósávban a "Törlés" gombbal (megerősítést kér)

**Megjegyzés**: A törölt értesítések véglegesen törlődnek és nem állíthatók vissza.

### Alkalmazás megnyitása

Ha egy értesítés alkalmazáshoz kapcsolódik:

- **Értesítési Központ panelben**: Kattintson az alkalmazás nevére (kék jelvény)
- **Értesítések alkalmazásban**: A részletek nézetben az "Alkalmazás megnyitása" gombra

Az alkalmazás megnyílik az értesítésben megadott paraméterekkel (ha vannak).

## Tálca értesítési ikon részletesen

### Ikon állapotok

A tálca jobb oldalán található csengő ikon dinamikusan változik az értesítések állapota szerint:

**1. Alapállapot (nincs értesítés):**

- Csak a csengő ikon látható
- Nincs jelvény

**2. Olvasatlan értesítések:**

- Piros jelvény a jobb felső sarokban
- A jelvényen az olvasatlan értesítések száma (1-99)
- 99 feletti értesítéseknél "99+" felirat

**3. Kritikus értesítés:**

- Sárga jelvény a jobb felső sarokban
- Fekete felkiáltójel a jelvényen
- Pulzáló animáció a figyelemfelkeltés érdekében

**4. Kombinált állapot:**

- Ha van kritikus ÉS olvasatlan értesítés is
- A sárga kritikus jelvény magasabban jelenik meg
- A piros olvasatlan számláló lejjebb

### Ikon műveletek

- **Bal klikk**: Megnyitja/bezárja az Értesítési Központ panelt

## Alkalmazás értesítések

Egyes alkalmazások saját értesítési számlálóval rendelkeznek:

### Üzenetek alkalmazás

- Ha a Chat alkalmazás meg van nyitva, de minimalizálva van vagy inaktív
- A tálcán az alkalmazás ikonján megjelenik egy jelvény az olvasatlan üzenetek számával
- Ez független az Értesítési Központ értesítéseitől

### Egyéb alkalmazások

Más alkalmazások is használhatják ezt a funkciót, hogy jelezzék az olvasatlan elemek számát a tálcán.

## Tippek és trükkök

- **Gyors hozzáférés**: A tálca értesítési ikonja mindig elérhető, bárhol is dolgozik
- **Kritikus értesítések**: A pulzáló sárga jelvény és a modal ablak azonnal felhívja a figyelmet a fontos eseményekre
- **Toast értesítések**: Az automatikusan megjelenő felugró értesítések nem zavarják a munkát, 5 másodperc után eltűnnek
- **Részletek gomb**: Gyorsan megnyithatja az Értesítések alkalmazást egy konkrét értesítésnél
- **Alkalmazás megnyitás**: Az értesítésből közvetlenül megnyithatja a kapcsolódó alkalmazást
- **Hover műveletek**: Az Értesítési Központ panelben az egérmutatóval gyorsan kezelheti az értesítéseket
- **Automatikus olvasás**: Az értesítésekre kattintva automatikusan olvasottá válnak
- **Kritikus értesítések nyugtázása**: A kritikus értesítéseket mindig el kell olvasni és az OK gombbal nyugtázni kell

## Kapcsolódó témák

- [Üzenetek](../chat) - Belső üzenetküldő rendszer
- [Beállítások](../settings) - Rendszerbeállítások testreszabása
- [Tálca](../../desktop-basics/taskbar) - A tálca használata és testreszabása
