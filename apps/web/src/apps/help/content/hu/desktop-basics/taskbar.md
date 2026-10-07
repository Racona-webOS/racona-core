---
title: Tálca
description: A tálca használata és funkciói
sidebar:
  order: 3
---

A tálca az asztal alsó részén található (vagy felül, ha úgy állította be), és gyors hozzáférést biztosít az alkalmazásokhoz és rendszerfunkciókhoz.

![Placeholder: Tálca elemei feliratozva - Indító panel gomb, alkalmazás gombok, óra, témaváltó, értesítési ikon](../../../../../assets/desktop/taskbar.webp)
_A tálca fő elemei és funkciói_

## Alkalmazás gombok

A tálcán megjelennek a futó alkalmazások gombjai:

- **Aktív alkalmazás**: Színes fénylő árnyék jelenik meg a gomb alatt
- **Inaktív alkalmazás**: Normál megjelenés árnyék nélkül
- **Minimalizált alkalmazás**: Halványabb megjelenés és szürkített ikon

### Alkalmazás gombok használata

Kattintson egy alkalmazás gombjára:

- Ha az alkalmazás aktív: minimalizálja (elrejti az asztalról)
- Ha az alkalmazás inaktív: előtérbe hozza és aktiválja
- Ha az alkalmazás minimalizált: visszaállítja az asztalra és aktiválja

## Ablak előnézetek a tálcán

Ha engedélyezve van a Beállítások alkalmazásban (Teljesítmény szakasz), az inaktív vagy minimalizált ablakok előnézeti képpel rendelkeznek:

1. Vigye az egeret egy alkalmazás gombjára a tálcán
2. Megjelenik az ablak előnézeti képe
3. Kattintson a gombra az ablak előtérbe hozásához vagy visszaállításához

## Óra

A tálca jobb oldalán található az óra:

- Megjeleníti az aktuális időt
- Az óra megjelenítése ki- és bekapcsolható a Beállításokban

## Témaváltó gomb

A témaváltó gomb lehetővé teszi a gyors váltást világos és sötét mód között:

1. Kattintson a témaváltó gombra (nap/hold ikon)
2. A téma azonnal vált
3. A beállítás automatikusan mentésre kerül

További testreszabási lehetőségekért lásd: [Rendszer testreszabása](../customization/)

## Értesítési ikon

Az értesítési ikon jelzi az új értesítéseket:

![Placeholder: Értesítési ikon különböző állapotokban - kritikus (sárga felkiáltójel), olvasatlan (piros szám), normál](../../../../../assets/desktop/notification.webp)
_Értesítési ikon különböző állapotokban_

### Értesítési állapotok

- **Kritikus értesítés**: Sárga körben lévő felkiáltójel pulzál az ikon felett
- **Olvasatlan értesítések**: Piros körben lévő szám mutatja az olvasatlan értesítések számát
- **Nincs értesítés**: Csak az értesítési ikon (csengő) látható
- **Kattintás**: Megnyitja az Értesítési Központot

> **Megjegyzés:** Ha egyszerre van kritikus és normál olvasatlan értesítés is, mindkét jelzés megjelenik az ikonon.

További információ: [Értesítések alkalmazás](../applications/notifications/)

## Alkalmazás megnyitó (GUID hivatkozás)

Az Alkalmazás Megnyitó funkció lehetővé teszi, hogy GUID hivatkozás alapján nyiss meg alkalmazásokat:

![Placeholder: Tálca jobb alsó sarkában lévő alkalmazás megnyitó ikon és a megnyíló párbeszédablak](../../../../../assets/desktop/guid-link.webp)
_GUID hivatkozás alapú alkalmazás megnyitás a tálcáról_

### Hogyan működik?

1. Kattints a tálca jobb alsó sarkában lévő "Alkalmazás megnyitó" ikonra (CopyPlus ikon)
2. Illeszd be a kapott GUID hivatkozást a megjelenő mezőbe
3. Kattints a "Megnyitás" gombra vagy használd a gyors beillesztés gombot (vágólap ikon)
4. Az alkalmazás megnyílik pontosan abban az állapotban, ahogy megosztották veled

### GUID hivatkozás generálása

A GUID hivatkozást az ablak [Link gombjával](./windows/#link-gomb-alkalmazás-megosztás) generálhatod, amely automatikusan a vágólapra másolja a hivatkozást.

### Fontos tudnivalók

- Ha az alkalmazás még nincs megnyitva, a GUID hivatkozás megnyitja az adott állapotban
- Ha az alkalmazás már fut, a hivatkozás frissíti annak állapotát (pl. átnavigál a megfelelő menüpontra)
- A hivatkozás tartalmazza az alkalmazás nevét és paramétereit (pl. aktuális menüpont)
- Ideális csapatmunkához, oktatáshoz és hibajelentésekhez

## Tálca testreszabása

A tálca megjelenését és viselkedését testreszabhatja a Beállítások alkalmazásban:

- **Pozíció**: Alul vagy felül
- **Óra megjelenítése**: Ki/be kapcsolás
- **Alkalmazás gombok**: Stílus és viselkedés

[Tálca beállítások →](../applications/settings/)

## Kapcsolódó Témák

- [Ablakkezelés](./windows/) - Ablakok kezelése
- [Értesítések](../applications/notifications/) - Értesítések kezelése
- [Beállítások](../applications/settings/) - Tálca testreszabása
