---
title: Toast üzenetek
description: Toast értesítések a Racona-ben
sidebar:
  order: 3
next:
  link: /hu/user/applications/
  label: Alkalmazások
---

A toast üzenetek rövid, átmeneti értesítések, amelyek a képernyő jobb felső sarkában jelennek meg. Azonnali visszajelzést adnak a végrehajtott műveletekről anélkül, hogy megszakítanák a munkafolyamatot.

## Mi az a Toast üzenet?

A "toast" elnevezés a kenyérpirítóból felugró pirítósra utal - hasonlóan, ezek az üzenetek "felugranak" a képernyőn, majd automatikusan eltűnnek néhány másodperc után.

**Jellemzők**:

- Rövid, tömör üzenetek
- Automatikusan eltűnnek (általában 3-5 másodperc után)
- Nem blokkolják a felhasználói felületet
- Színkódoltak a típus szerint
- A képernyő jobb felső sarkában jelennek meg

## Toast üzenetek típusai

A Racona négy típusú toast üzenetet használ:

### 1. Siker - zöld

**Mikor jelenik meg?**

- Sikeres mentés
- Sikeres létrehozás
- Sikeres törlés
- Sikeres frissítés

**Példák**:

- "Felhasználó sikeresen létrehozva"
- "Beállítások mentve"
- "Értesítés törölve"
- "Profil frissítve"

**Vizuális jelzés**: Zöld háttér, pipa ikon

### 2. Hiba - piros

**Mikor jelenik meg?**

- Sikertelen művelet
- Hálózati hiba
- Validációs hiba
- Jogosultsági hiba

**Példák**:

- "Hiba történt a mentés során"
- "Nem sikerült betölteni az adatokat"
- "Nincs jogosultsága ehhez a művelethez"
- "A jelszó túl rövid"

**Vizuális jelzés**: Piros háttér, X ikon

### 3. Figyelmeztetés - sárga/narancssárga

**Mikor jelenik meg?**

- Fontos információ
- Potenciális probléma
- Figyelmeztetés következményekről

**Példák**:

- "A művelet hosszabb időt vehet igénybe"
- "Néhány mező nincs kitöltve"
- "A munkamenet hamarosan lejár"

**Vizuális jelzés**: Sárga/narancssárga háttér, figyelmeztető ikon

### 4. Információ - kék

**Mikor jelenik meg?**

- Általános információ
- Folyamat állapota
- Tájékoztató üzenetek

**Példák**:

- "Adatok betöltése folyamatban"
- "Link vágólapra másolva"
- "Alkalmazás megnyitva"

**Vizuális jelzés**: Kék háttér, információs ikon

## Toast üzenetek használata

### Automatikus megjelenés

A toast üzenetek automatikusan megjelennek, amikor egy műveletet hajt végre:

1. Végrehajt egy műveletet (pl. mentés gomb megnyomása)
2. A toast üzenet megjelenik a jobb felső sarokban
3. Az üzenet néhány másodperc után automatikusan eltűnik

### Manuális bezárás

Ha gyorsabban szeretné eltüntetni az üzenetet:

1. Vigye az egeret a toast üzenet fölé
2. Kattintson az X gombra a jobb felső sarokban
3. Az üzenet azonnal eltűnik

### Több toast üzenet

Ha több művelet történik egymás után, több toast üzenet is megjelenhet egyszerre:

- Az üzenetek egymás alatt sorakoznak
- A legújabb üzenet kerül legfelülre
- Minden üzenet külön-külön tűnik el a saját időzítése szerint

## Tippek és trükkök

- **Ne pánikoljunk**: A toast üzenetek automatikusan eltűnnek, nem kell bezárni őket
- **Olvassuk el gyorsan**: Az üzenetek rövid ideig láthatók, de általában elég idő van elolvasni őket
- **Színkódok**: A háttérszín azonnal jelzi az üzenet típusát
- **Több művelet**: Ha több műveletet hajt végre gyorsan, várja meg, amíg az előző toast üzenet eltűnik, hogy ne keveredjenek össze

## Toast vs. modális ablak

**Toast üzenetek jellemzői:**

- Gyors visszajelzést adnak már végrehajtott műveletekről
- Automatikusan megjelennek és eltűnnek
- Nem igényelnek felhasználói interakciót
- Nem blokkolják a munkafolyamatot

**Modal ablakok jellemzői:**

- Megerősítést kérnek a művelet végrehajtása előtt
- Fontos döntési pontokat jeleznek
- Részletes információkat jelenítenek meg
- Felhasználói választ igényelnek (megerősítés vagy elutasítás)

## Kapcsolódó témák

- [Modális ablakok](../dialogs) - Megerősítő ablakok fontos műveletek előtt
- [Adattáblák](../data-tables) - Toast üzenetek gyakran adattábla műveletek után jelennek meg
- [Értesítések alkalmazás](../../applications/notifications) - Rendszer értesítések kezelése
