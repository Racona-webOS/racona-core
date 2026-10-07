---
title: Adattáblák
description: Adattáblák (listák) használata a Racona-ben
sidebar:
  order: 1
---

Az adattáblák (Data Tables) a Racona egyik leggyakrabban használt komponense. Strukturált adatok megjelenítésére szolgálnak táblázatos formában, rendezési, szűrési és lapozási funkciókkal.

## Hol találkozhat adattáblákkal?

Az adattáblák számos alkalmazásban megjelennek:

- **Felhasználók alkalmazás**: Felhasználók, csoportok, szerepkörök, jogosultságok listája
- **Értesítések alkalmazás**: Értesítések listája
- **Napló alkalmazás**: Hibanaplók és rendszeresemények listája

## Az adattábla felépítése

Egy adattábla a következő részekből áll:

![Placeholder: Adattábla felépítése](../../../../../assets/ui/datatable.webp)
_Adattábla felépítése és elemei_

### 1. Fejléc

A táblázat tetején található fejléc sorok tartalmazzák az oszlopneveket. Az oszlopnevek mellett gyakran megjelenik egy rendezés ikon, amely jelzi, hogy az oszlop szerint rendezhető-e az adat.

**Rendezés**: Kattintson egy oszlop nevére a rendezéshez:

- Első kattintás: Növekvő sorrend
- Második kattintás: Csökkenő sorrend
- Harmadik kattintás: Rendezés törlése

### 2. Adatsorok

A táblázat sorai tartalmazzák a tényleges adatokat. Minden sor egy elemet reprezentál (pl. egy felhasználót, egy értesítést).

### 3. Műveleti oszlop

A táblázat jobb szélén található műveleti oszlop tartalmazza az adott sorra vonatkozó műveleteket.

#### Egyetlen művelet

Ha csak egy művelet érhető el, egyszerű gomb jelenik meg:

```
[ Megnyitás ]
```

#### Több művelet - elsődleges gomb + lenyíló

Ha több művelet is elérhető, a legfontosabb (elsődleges) művelet külön gombként jelenik meg, a többi művelet pedig egy lenyíló menüben:

```
[ Megnyitás ] [⋮]
```

- **Elsődleges gomb** (bal oldal): A leggyakrabban használt művelet (pl. "Megnyitás", "Szerkesztés")
- **Dropdown gomb** (jobb oldal, 3 függőleges pont): További műveletek menüje

**Használat**:

1. Kattintson az elsődleges gombra a fő művelet végrehajtásához
2. Kattintson a 3 pontos gombra a további lehetőségek megjelenítéséhez
3. Válasszon egy műveletet a dropdown menüből

**Példa műveletek**:

- Megnyitás / Szerkesztés (elsődleges)
- Aktiválás / Deaktiválás
- Törlés (általában piros színnel jelölve)

### 4. Szűrők és keresés

Sok adattábla rendelkezik szűrési lehetőségekkel a fejléc felett:

- **Keresőmező**: Szöveges keresés az adatok között
- **Szűrő gombok**: Előre definiált szűrők (pl. "Aktív", "Inaktív", "Kritikus")
- **Egyedi szűrők**: Alkalmazás-specifikus szűrési lehetőségek

### 5. Oszlop láthatóság

A táblázat jobb felső sarkában található "Oszlopok" gomb lehetővé teszi az oszlopok láthatóságának testreszabását:

1. Kattints az "Oszlopok" gombra (fogaskerék ikon)
2. Jelöld be vagy töröld a jelölést az oszlopok mellett
3. A táblázat automatikusan frissül

**Megjegyzés**: Egyes oszlopok (pl. név, műveletek) nem rejthetők el, mert elengedhetetlenek a táblázat használatához.

### 6. Lapozás

A táblázat alján található lapozó sáv lehetővé teszi a nagy adathalmazok böngészését:

- **Összes sor száma**: Bal oldalon látható az összes elem száma
- **Sorok száma oldalanként**: Választható (általában 10, 20, 50, 100)
- **Oldalszámok**: Kattintható oldalszámok a gyors navigációhoz
- **Előző/Következő gombok**: Léptetés az oldalak között

## Gyakori műveletek

### Elem megnyitása

1. Keresd meg a kívánt elemet a táblázatban
2. Kattints a "Megnyitás" vagy "Szerkesztés" gombra a műveleti oszlopban
3. Az elem részletei megjelennek

### Elem törlése

1. Keresd meg a törölni kívánt elemet
2. Kattints a 3 pontos gombra a műveleti oszlopban
3. Válaszd a "Törlés" opciót (általában piros színnel jelölve)
4. Erősítsd meg a törlést a megjelenő megerősítő ablakban

**Figyelem**: A törlés általában végleges és nem vonható vissza!

### Adatok rendezése

1. Kattints az oszlop nevére a fejlécben
2. A táblázat automatikusan rendeződik
3. A rendezés iránya (növekvő/csökkenő) a fejlécben látható nyíl ikonnal jelzett

### Adatok szűrése

1. Használd a keresőmezőt szöveges kereséshez
2. Kattints a szűrő gombokra előre definiált szűrők alkalmazásához
3. A táblázat automatikusan frissül a szűrési feltételek alapján
4. A "Szűrők törlése" gombbal visszaállíthatod az eredeti állapotot

## Tippek és trükkök

- **Gyors keresés**: Kezdd el gépelni a keresőmezőbe - a táblázat azonnal szűrődik
- **Több szűrő kombinálása**: Használj keresést és szűrőgombokat együtt a pontosabb eredményekért
- **Oszlopok testreszabása**: Rejtsd el a nem használt oszlopokat a tisztább megjelenésért
- **Lapméret növelése**: Ha sok elemet szeretnél egyszerre látni, növeld a sorok számát oldalanként

## Kapcsolódó témák

- [Modális ablakok](../dialogs) - Megerősítő ablakok a törlési műveleteknél
- [Toast üzenetek](../notifications) - Visszajelzések a végrehajtott műveletekről
