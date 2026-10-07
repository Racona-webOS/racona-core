---
title: Térkép
description: A Térkép alkalmazás részletes használata
sidebar:
  order: 6
---

A Térkép alkalmazás egy interaktív térképnézegető és útvonaltervező, amely OpenStreetMap adatokon alapul.

## Alapinformációk

- **Kategória**: Segédprogramok
- **Többpéldányos**: Igen
- **Jogosultság**: Publikus (minden felhasználó)

## Felület áttekintése

A Térkép alkalmazás két fő részből áll:

- **Bal oldali panel**: Keresés és útvonaltervező eszközök
- **Jobb oldali terület**: Interaktív térkép

A bal oldali panel két fülre osztódik: **Keresés** és **Útvonal**.

## Keresés fül

A Keresés fülön helyek, városok, utcák és egyéb pontok kereshetők a térképen.

### Hely keresése

1. Kattints a **Keresés** fülre
2. Írd be a keresett helyet a beviteli mezőbe (pl. "Parlament, Budapest")
3. Nyomj Enter billentyűt vagy kattints a nagyító ikonra
4. A találatok listában jelennek meg
5. Kattints egy találatra a térkép odaugrik és lila markerrel jelöli a helyet

### Találat törlése

A kijelölt hely törléséhez kattints a **Törlés** gombra a találat alatt.

## Útvonal fül

Az Útvonal fülön két pont között tervezhetsz útvonalat különböző közlekedési módokkal.

### Útvonal tervezése

1. Kattints az **Útvonal** fülre
2. Add meg az **Indulás** helyét (pl. "Budapest, Keleti")
3. Add meg az **Érkezés** helyét (pl. "Debrecen, Főpályaudvar")
4. Válaszd ki a **Közlekedési módot**
5. Kattints az **Útvonal tervezése** gombra
6. Az útvonal kék vonallal jelenik meg a térképen, a végpontok A és B markerekkel

A térkép automatikusan ráközelít az útvonalra, hogy mindkét végpont látható legyen.

### Aktuális hely használata indulásként

Az Indulás mező mellett található célkereszt ikon segítségével az aktuális tartózkodási helyed automatikusan beállítható indulási pontként:

1. Kattints a célkereszt ikonra az Indulás mező mellett
2. A böngésző engedélyt kér a helymeghatározáshoz – engedélyezd
3. Az aktuális hely koordinátái és neve automatikusan bekerülnek az Indulás mezőbe

### Közlekedési módok

Három közlekedési mód közül választhat:

| Mód | Leírás |
|-----|--------|
| **Autó** | Gépjárműves útvonal, figyelembe veszi az utakat és forgalmi szabályokat |
| **Gyalog** | Gyalogos útvonal, gyalogutakon és járdákon |
| **Kerékpár** | Kerékpáros útvonal, kerékpárutakon és megfelelő utakon |

### Útvonal beállítások

A **Beállítások** gombra kattintva további útvonaltervezési opciók érhetők el:

- **Fizetős utak kerülése** – Autó módban: elkerüli a fizetős utakat és autópálya-matricás szakaszokat *(csak autó módban érhető el)*
- **Autópályák kerülése** – Autó módban: elkerüli az autópályákat és gyorsforgalmi utakat *(csak autó módban érhető el)*
- **Kompok kerülése** – Minden módban: elkerüli a kompjáratokat

### Útvonal eredménye

Sikeres tervezés után az alkalmazás megjeleníti:

- **Távolság**: Az útvonal teljes hossza kilométerben
- **Menetidő**: A becsült menetidő

### Útvonal törlése

Az útvonal és a markerek törléséhez kattints a **Törlés** gombra.

## Térkép vezérlők

A térkép jobb oldalán található vezérlők:

- **+ / –**: Nagyítás és kicsinyítés
- **Iránytű**: Észak irányba forgatja a térképet
- **Célkereszt ikon**: Aktuális tartózkodási hely megjelenítése a térképen (GeoLocate)
- **Méretarány**: A térkép jobb alsó sarkában látható

A térképen az egérrel is navigálhat: húzással mozgathatja a nézetet, görgetéssel nagyíthat/kicsinyíthet.

## Fülváltás

A Keresés és Útvonal fülek között váltva az előző fül állapota automatikusan törlődik – a markerek és az útvonal eltűnnek a térképről.

## Adatforrások

A Térkép alkalmazás nyílt forrású adatokat és szolgáltatásokat használ:

- **Térképadatok**: [OpenStreetMap](https://www.openstreetmap.org) közreműködők
- **Térkép stílus**: CARTO Voyager
- **Geocoding** (helyek keresése): Nominatim / OpenStreetMap
- **Útvonaltervezés**: Valhalla / OpenStreetMap.de

## Kapcsolódó témák

- [Értesítések](/hu/user/applications/notifications/) – Rendszerértesítések kezelése
- [Beállítások](/hu/user/applications/settings/) – Rendszerbeállítások testreszabása
