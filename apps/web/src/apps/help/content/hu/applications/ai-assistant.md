---
title: AI Asszisztens
description: Az AI Asszisztens alkalmazás részletes használata
sidebar:
  order: 9
---

Az AI Asszisztens egy intelligens virtuális asszisztens, amely segít a mindennapi feladatok elvégzésében, kérdések megválaszolásában és a rendszer használatában.

## Alapinformációk

- **Kategória**: Segédprogramok
- **Többpéldányos**: Nem
- **Jogosultság**: Publikus (minden felhasználó)
- **Elérés**: Tálca ikon (chat panel) és dedikált alkalmazás ablak (beállítások)

![Placeholder: AI Asszisztens](../../../../../assets/application/ai.webp)
_AI asszisztens

## Funkciók áttekintése

Az AI Asszisztens két fő komponensből áll:

1. **Chat Panel**: Gyors hozzáférés a tálcáról, valós idejű beszélgetés az AI-val
2. **Beállítások Ablak**: Avatar és TTS (Text-to-Speech) beállítások kezelése

## Chat Panel használata

### Megnyitás

A Chat Panel a tálcán található AI Asszisztens ikonra kattintva nyitható meg. A panel a képernyő jobb oldalán jelenik meg, és nem zavarja a munkafolyamatot.

### Beszélgetés

- **Üzenet írása**: Írj be egy kérdést vagy kérést a beviteli mezőbe
- **Üzenet küldése**: Nyomd meg az Enter billentyűt vagy kattints a küldés gombra
- **Válasz**: Az AI Asszisztens válaszol a kérdésedre vagy elvégzi a kért feladatot

### Funkciók

- **Valós idejű válaszok**: Az AI azonnal válaszol a kérdéseidre
- **Kontextus megértés**: Az AI emlékszik a beszélgetés korábbi részére
- **Többnyelvű támogatás**: Az AI több nyelven is kommunikál
- **Hang kimenet**: Ha engedélyezve van a TTS, az AI hangosan is felolvassa a válaszokat

## Beállítások

Az AI Asszisztens beállításai a dedikált alkalmazás ablakon keresztül érhetők el. Az alkalmazást az Indító Panelből vagy az asztali parancsikonból indíthatod.

### Avatar Beállítások

Az Avatar beállítások lehetővé teszik az AI Asszisztens vizuális megjelenésének testreszabását.

**Főbb funkciók:**

- **Avatar kiválasztása**: Válassz a telepített avatarok közül
- **Minőség beállítása**: SD (Standard Definition) vagy HD (High Definition) minőség
- **Előnézet**: Valós idejű előnézet a kiválasztott avatarról

**Avatar telepítése:**

Az új avatarok telepítése adminisztrátori jogosultságot igényel. Az adminisztrátorok a Beállítások > Hitelesítés > AI Asszisztens > Avatar Telepítés menüpontban tölthetnek fel új avatarokat `.raconapkg` formátumban.

### TTS (Text-to-Speech) Beállítások

A TTS beállítások lehetővé teszik a hang kimenet testreszabását.

**Főbb funkciók:**

- **Hang kiválasztása**: Válassz a rendelkezésre álló hangok közül
- **Sebesség**: Állítsd be a beszéd sebességét
- **Hangerő**: Állítsd be a hangerőt
- **Teszt**: Próbáld ki a beállításokat egy teszt mondattal

**TTS Provider:**

Az adminisztrátorok a Beállítások > Hitelesítés > AI Asszisztens > TTS Provider menüpontban állíthatják be a TTS szolgáltatót (Browser Web Speech API vagy ElevenLabs).

## Mentés és Visszavonás

- **Mentés**: A változtatások mentéséhez kattints a "Mentés" gombra az ablak alján
- **Mégse**: A változtatások elvetéséhez kattints a "Mégse" gombra
- **Teszt**: A TTS beállítások teszteléséhez kattints a "Teszt" gombra (lejátszás ikon)

**Megjegyzés**: A mentés gomb csak akkor aktív, ha van nem mentett változtatás.

## Tippek és trükkök

- **Gyors hozzáférés**: Használd a tálca ikont a gyors chat panel megnyitásához
- **Kontextus**: Az AI emlékszik a beszélgetés korábbi részére, így nem kell minden alkalommal újra elmagyarázni a kontextust
- **Többnyelvű**: Az AI automatikusan felismeri a nyelvet, amelyen írsz
- **Hang kimenet**: Ha engedélyezve van a TTS, az AI hangosan is felolvassa a válaszokat - ideális multitasking közben

## Gyakori kérdések

**Hogyan kapcsolhatom ki a hang kimenetet?**
Az adminisztrátorok a Beállítások > Hitelesítés > AI Asszisztens > TTS Provider menüpontban kapcsolhatják ki a TTS szolgáltatást.

**Miért nem válaszol az AI?**
Ellenőrizd, hogy az AI Agent konfigurálva van-e az adminisztrátorok által. Ha a probléma továbbra is fennáll, nézd meg a Napló alkalmazást a részletes hibaüzenetekért.

**Hogyan telepíthetek új avatart?**
Az új avatarok telepítése adminisztrátori jogosultságot igényel. Kérd meg az adminisztrátort, hogy töltse fel az új avatart a Beállítások > Hitelesítés > AI Asszisztens > Avatar Telepítés menüpontban.

**Milyen formátumban kell lennie az avatar csomagnak?**
Az avatar csomagnak `.raconapkg` formátumban kell lennie. Ez egy speciális csomag formátum, amely tartalmazza az avatar összes szükséges fájlját.

## Kapcsolódó Témák

- [Beállítások - AI Asszisztens](./settings.md#ai-asszisztens) - AI Asszisztens beállítások részletesen
- [Beállítások - Hitelesítés](./settings.md#hitelesítés) - Adminisztrátori AI beállítások
- [A felület használata](../desktop-basics.md) - A Racona felületének alapjai
