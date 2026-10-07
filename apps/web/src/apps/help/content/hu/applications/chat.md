---
title: Üzenetek
description: Az üzenetek alkalmazás részletes használata
sidebar:
  order: 4
---

Az Üzenetek alkalmazás egy belső üzenetküldő rendszer, amely lehetővé teszi a valós idejű kommunikációt más Racona felhasználókkal.

## Alapinformációk

- **Kategória**: Kommunikáció
- **Többpéldányos**: Nem
- **Jogosultság**: Publikus (minden felhasználó)

## Felület áttekintése

Az Üzenetek alkalmazás három fő részből áll:

- **Jobb oldali panel**: Felhasználók listája online/offline státusszal (összecsukható)
- **Bal oldali panel**: Beszélgetések listája
- **Középső panel**: Aktív beszélgetés üzenetei

![Placeholder: Üzenetek alkalmazás felülete](../../../../../assets/application/chat.webp)
_Az Üzenetek alkalmazás felülete_

## Felhasználók

### Felhasználók listája

A jobb oldali panelen láthatja az összes Racona felhasználót online/offline státusz szerint csoportosítva:

- **Online felhasználók**: Zöld státusz jelzővel, alapértelmezetten kinyitva
- **Offline felhasználók**: Szürke státusz jelzővel, alapértelmezetten összecsukva

### Felhasználók keresése

A felhasználók listájában gyorsan megtalálhatja a kívánt személyt:

- Használja a keresőmezőt a jobb oldali panel tetején
- Keressen név vagy felhasználónév alapján
- A találatok automatikusan szűrődnek gépelés közben

### Oldalsáv összecsukása

A jobb oldali felhasználói listát összecsukhatja a bal szélén található nyíl gombbal, így több hely marad az üzeneteknek. Az állapot automatikusan mentésre kerül.

## Beszélgetések

### Új beszélgetés indítása

Új beszélgetés kezdeményezése:

1. Kattintson egy felhasználóra a jobb oldali listában
2. Automatikusan létrejön vagy megnyílik a beszélgetés
3. Írja be az első üzenetet
4. Nyomja meg az Enter billentyűt vagy kattintson a küldés gombra

### Beszélgetések Listája

A bal oldali panelen láthatja az aktív beszélgetéseit:

- **Felhasználó neve és profilképe**: A beszélgetőpartner adatai
- **Utolsó üzenet előnézete**: Az utolsó üzenet első 50 karaktere
- **Időbélyeg**: Mennyi ideje érkezett az utolsó üzenet (relatív időformátumban)
- **Olvasatlan üzenetek száma**: Piros jelvény az olvasatlan üzenetek számával

A beszélgetések automatikusan a legutóbbi aktivitás szerint rendeződnek. A legfrissebb beszélgetés mindig felül jelenik meg.

### Beszélgetések frissítése

A beszélgetések lista fejlécében található frissítés gombbal manuálisan is frissítheti a listát.

## Üzenetek küldése

### Szöveges üzenet

Egyszerű szöveges üzenet küldése:

1. Válasszon ki egy beszélgetést
2. Kattintson az üzenet beviteli mezőre
3. Írja be az üzenetet
4. Nyomja meg az Enter billentyűt vagy kattintson a küldés gombra

### Gépelés jelzés

Amikor üzenetet ír, a beszélgetőpartner látja, hogy éppen gépel. A gépelés jelzés automatikusan megjelenik és 3 másodperc inaktivitás után eltűnik.

### Üzenetek megjelenítése

Az üzenetek csoportosítva jelennek meg:

- **Profilkép**: Csak az első üzenetnél jelenik meg egy csoportban
- **Feladó neve és időbélyeg**: Az első üzenetnél látható
- **Üzenet tartalom**: Világos háttérrel, kerekített sarokokkal
- **Hover effekt**: Az üzenetek fölé húzva kiemelésre kerülnek

## Valós idejű kommunikáció

Az Üzenetek alkalmazás WebSocket technológiát használ a valós idejű kommunikációhoz:

- **Azonnali üzenetkézbesítés**: Az üzenetek azonnal megjelennek mindkét félnél
- **Online státusz**: Valós időben látható, ki van online
- **Gépelés jelzés**: Láthatja, amikor a másik fél éppen ír
- **Automatikus frissítés**: Nincs szükség manuális frissítésre

## Értesítések és jelzések

### Tálca ikon

A tálca jobb oldalán található üzenetek ikon (üzenetbuborék) jelzi az olvasatlan üzenetek számát:

- **Kék jelvény**: Megjelenik, ha van olvasatlan üzenet
- **Számláló**: Mutatja az olvasatlan üzenetek számát (maximum 99+)
- **Gyors hozzáférés**: Az ikonra kattintva megnyílik az Üzenetek alkalmazás

### Alkalmazás ablak jelzés

Ha az Üzenetek alkalmazás meg van nyitva, de minimalizálva van vagy inaktív:

- A tálcán az alkalmazás ikonján megjelenik egy jelvény az olvasatlan üzenetek számával
- Ez segít gyorsan észrevenni az új üzeneteket anélkül, hogy az alkalmazást előtérbe kellene hozni

## Tippek és trükkök

- **Gyors beszélgetésindítás**: Kattintson bármelyik felhasználóra a jobb oldali listában
- **Oldalsáv összecsukása**: Több hely az üzeneteknek, ha összecsukja a felhasználói listát
- **Automatikus görgetés**: Az új üzenetek automatikusan a képernyő aljára görgetnek
- **Relatív időformátum**: Az időbélyegek relatív formában jelennek meg (pl. "2 perce", "1 órája")
- **Tálca ikon**: Gyorsan ellenőrizheti az olvasatlan üzenetek számát a tálca jobb oldalán

## Adatvédelem és biztonság

- Az üzenetek biztonságosan tárolva vannak az adatbázisban
- Csak a beszélgetés résztvevői láthatják az üzeneteket
- A valós idejű kommunikáció WebSocket protokollon keresztül történik

## Kapcsolódó Témák

- [Értesítések](../notifications) - Rendszerértesítések kezelése
- [Beállítások](../settings) - Rendszerbeállítások testreszabása
