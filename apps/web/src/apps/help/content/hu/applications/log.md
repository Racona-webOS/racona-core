---
title: Napló
description: A napló alkalmazás részletes használata
sidebar:
  order: 7
---

A Napló alkalmazás megjeleníti a rendszer naplóit, hibaüzeneteket és aktivitási előzményeket.

## Alapinformációk

- **Kategória**: Rendszer
- **Többpéldányos**: Igen (több napló ablakot nyithat meg)
- **Jogosultság**: Publikus (minden felhasználó, de egyes funkciók jogosultság-kötöttek)

## Napló típusok

A Napló alkalmazás két fő menüponttal rendelkezik:

### Hiba napló

A rendszerben naplózott hibák listája. Megjeleníti az alkalmazások és a rendszer által naplózott hibaüzeneteket.

**Jogosultság**: A hiba napló megtekintéséhez `log.error.view` jogosultság szükséges.

### Aktivitás napló

A Napló alkalmazás Aktivitás napló menüpontja megjeleníti a rendszerben végrehajtott felhasználói és adminisztrátori műveleteket.

**Jogosultság**: Az aktivitás napló megtekintéséhez `log.activity.view` jogosultság szükséges.

## Hiba napló használata

### Napló lista

A hiba napló táblázatos formában jeleníti meg a naplózott hibákat:

**Táblázat oszlopai:**

- **Szint**: A hiba súlyossági szintje (DEBUG, INFO, WARN, ERROR, FATAL)
- **Üzenet**: A hibaüzenet szövege
- **Forrás**: Melyik alkalmazás vagy komponens naplózta a hibát
- **Időpont**: Mikor történt a hiba
- **URL**: Az URL, ahol a hiba történt (ha releváns)

**Táblázat funkciók:**

- **Rendezés**: Bármelyik oszlop szerint rendezhető (alapértelmezetten időpont szerint csökkenő)
- **Lapozás**: 20 hiba oldalanként
- **Csíkozott megjelenítés**: Jobb olvashatóság érdekében

További információ a táblázatok kezeléséről: [Táblázatok használata](../components/tables.md) _(TODO: Ez a dokumentáció még nem készült el)_

### Szűrés

A hiba napló fejlett szűrési lehetőségeket kínál:

**Forrás szűrés:**

- Írja be a forrás nevét a keresőmezőbe
- A szűrés 300 ms késleltetéssel automatikusan aktiválódik
- Placeholder szöveg: "Forrás szűrése..."

**Szint szűrés:**

- Kattintson a "Szint" szűrő gombra
- Válasszon egy vagy több szintet:
  - DEBUG
  - INFO
  - WARN
  - ERROR
  - FATAL
- Több szint is kiválasztható egyszerre

**Szűrők visszaállítása:**

- Ha aktív szűrő van, megjelenik a "Visszaállítás" gomb
- Kattintson rá az összes szűrő törléséhez

## Aktivitás napló

Az Aktivitás napló megjeleníti a rendszerben végrehajtott felhasználói és adminisztrátori műveleteket táblázatos formában.

### Táblázat oszlopai

- **Művelet**: A végrehajtott művelet leírása (pl. "Bejelentkezés", "Plugin telepítve")
- **Felhasználó**: A műveletet végrehajtó felhasználó azonosítója
- **Erőforrás**: Az érintett erőforrás típusa és azonosítója (pl. `plugin:chat-plugin`)
- **Időpont**: Mikor történt a művelet

### Szűrés

- **Felhasználó szűrő**: Szűrés felhasználó azonosítója alapján
- **Művelet szűrő**: Szűrés művelet kulcs alapján (pl. `user.login`, `plugin.installed`)

### Naplózott műveletek

Az aktivitás napló az alábbi eseményeket rögzíti:

- Felhasználó bejelentkezés / kijelentkezés
- Profil frissítés
- Felhasználó aktiválás / deaktiválás
- Csoport és szerepkör hozzárendelések
- Plugin telepítés / eltávolítás
- Szerepkör és jogosultság kezelés

## Tippek és trükkök

- **Szűrők kombinálása**: A forrás és szint szűrők együtt is használhatók a pontos találatokhoz
- **Rendezés**: Kattintson az oszlop fejlécekre a rendezés megváltoztatásához
- **Lapozás**: Használja a lapozó gombokat a régebbi hibák megtekintéséhez
- **Jogosultságok**: Ha nem látja a Hiba napló menüpontot, kérjen `log.error.view` jogosultságot

## Kapcsolódó témák

- [Felhasználók](../users) - Jogosultságok kezelése
