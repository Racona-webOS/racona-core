---
title: Modális ablakok
description: Modális ablakok használata a Racona-ben
sidebar:
  order: 2
---

A modal ablakok átmeneti felugró ablakok, amelyek fontos információkat jelenítenek meg vagy megerősítést kérnek a felhasználótól. A modal ablakok megjelenésekor a háttér elsötétül, és a felhasználó csak a modal ablakkal tud interakcióba lépni.

![Placeholder: Modális ablak minta](../../../../../assets/ui/modal.webp)
_Példa modális ablak_

## Modalis ablakok típusai

A Racona két fő típusú modal ablakot használ:

### 1. Megerősítő ablak

A megerősítő ablak egyszerű, kétgombos ablak, amely megerősítést kér a felhasználótól egy fontos művelet végrehajtása előtt.

**Felépítés**:

- **Cím**: A művelet rövid leírása (pl. "Felhasználó törlése")
- **Leírás**: Részletesebb információ a műveletről és annak következményeiről
- **Mégse gomb**: Megszakítja a műveletet és bezárja az ablakot
- **Megerősítő gomb**: Végrehajtja a műveletet

**Mikor jelenik meg?**

- Törlési műveletek előtt (felhasználó, csoport, szerepkör törlése)
- Visszavonhatatlan műveletek előtt
- Fontos beállítások módosítása előtt

**Példa használat**:

1. Kattints a "Törlés" gombra egy elem mellett
2. Megjelenik a megerősítő ablak
3. Olvasd el a leírást és a figyelmeztetést
4. Válassz:
   - **Mégse**: Megszakítja a műveletet, semmi nem történik
   - **Törlés/Megerősítés**: Végrehajtja a műveletet

**Vizuális jelzések**:

- **Veszélyes műveletek**: A megerősítő gomb piros színű (pl. törlés)
- **Normál műveletek**: A megerősítő gomb kék vagy szürke színű

### 2. Egyedi ablak

Az egyedi ablak összetettebb tartalom megjelenítésére szolgál, például űrlapok, részletes információk vagy többlépéses folyamatok.

**Felépítés**:

- **Cím**: Az ablak címe
- **Leírás** (opcionális): Rövid magyarázat
- **Tartalom terület**: Egyedi tartalom (űrlapok, listák, stb.)
- **Funkciógombok**: Egy vagy több gomb a műveletek végrehajtásához

**Mikor jelenik meg?**

- Új elem létrehozása (pl. új felhasználó, új csoport)
- Összetett szerkesztési műveletek
- Többlépéses folyamatok
- Részletes információk megjelenítése

**Példa használat**:

1. Kattints az "Új létrehozása" vagy hasonló gombra
2. Megjelenik az egyedi ablak az űrlappal
3. Töltsd ki a szükséges mezőket
4. Kattints a "Mentés" vagy "Létrehozás" gombra
5. Az ablak bezárul és a művelet végrehajtódik

## Modalis ablakok használata

### Ablak megnyitása

A modal ablakok automatikusan megnyílnak, amikor egy adott műveletet kezdeményezel:

- Törlés gomb megnyomása
- Új elem létrehozása gomb megnyomása
- Szerkesztés gomb megnyomása (egyes esetekben)

### Ablak Bezárása

A modal ablakokat többféleképpen bezárhatod:

1. **Mégse/Bezárás gomb**: Megszakítja a műveletet
2. **X gomb** (jobb felső sarok): Megszakítja a műveletet
3. **Escape billentyű**: Megszakítja a műveletet
4. **Háttérre kattintás**: Egyes ablakoknál megszakítja a műveletet
5. **Művelet végrehajtása**: A megerősítő gomb megnyomása után az ablak automatikusan bezárul

**Fontos**: Ha bezárod az ablakot a művelet végrehajtása nélkül, a változtatások nem kerülnek mentésre!

## Tippek és trükkök

- **Gyors bezárás**: Nyomj Escape billentyűt a modal ablak gyors bezárásához (ha engedélyezve van)
- **Figyelmesen olvasd el**: A piros gombos műveletek általában visszavonhatatlanok
- **Űrlapok kitöltése**: A kötelező mezők általában csillaggal (\*) vannak jelölve

## Kapcsolódó témák

- [Toast üzenetek](./notifications) - Visszajelzések a modal ablakban végrehajtott műveletekről
- [Adattáblák](./data-tables) - Modal ablakok gyakran adattáblákból nyílnak meg
- [Felhasználók alkalmazás](../applications/users) - Példa modal ablakok használatára
