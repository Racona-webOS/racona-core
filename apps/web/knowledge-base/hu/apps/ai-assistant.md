---
title: AI Asszisztens alkalmazás
category: apps
tags: [ai, asszisztens, chat, avatar, mesterséges intelligencia, beszélgetés, tudásbázis, beállítások, telepítés]
aliases: [ai assistant, mesterséges intelligencia, chatbot, virtuális asszisztens, ai chat, rico]
last_updated: 2025-01-20
---

# AI Asszisztens alkalmazás

## Rövid összefoglaló
Az AI Asszisztens a Racona rendszer intelligens segítője. Kérdéseket tehetsz fel, segítséget kérhetsz, és természetes nyelven kommunikálhatsz vele. Az asszisztens tudásbázis alapú válaszokat ad és testreszabható avatárokkal rendelkezik.

## Alkalmazás elérése
**Elérési út:** Indító menü → AI Asszisztens
**Ikon:** Robot/AI ikon
**Gyorsbillentyű:** Nincs
**Tálca hozzáférés:** AI Asszisztens ikon a tálcán

## Főmenü struktúra

### 1. Beállítások (Settings)
**Elérési út:** AI Asszisztens → Beállítások

#### Avatar kiválasztás
- **Telepített avatárok**: Rendszerben elérhető avatárok listája
- **Avatar előnézet**: Vizuális megjelenítés
- **Egyéni név**: Személyre szabott név megadása az avatárnak
- **Minőség beállítás**: Avatar renderelési minőség
- **Alapértelmezett**: Ha nincs avatar kiválasztva

#### Avatar tulajdonságok
- **Név**: Avatar megjelenített neve (pl. "Rico")
- **Megjelenés**: Vizuális stílus és karakter
- **Személyiség**: Kommunikációs stílus
- **Nyelv támogatás**: Magyar és angol nyelvű interakció

#### Beállítások mentése
- **Automatikus mentés**: Változtatások azonnali alkalmazása
- **Megerősítés**: Sikeres mentés visszajelzése
- **Hibakezelés**: Mentési problémák jelzése

### 2. Telepítés (Install)
**Elérési út:** AI Asszisztens → Telepítés

#### Avatar csomag telepítése
- **Fájlformátum**: .raconapkg fájlok
- **Feltöltés**: Drag & drop vagy fájl tallózás
- **Validáció**: Automatikus csomag ellenőrzés
- **Telepítési folyamat**: Progresszív telepítés
- **Hibaelhárítás**: Telepítési problémák kezelése

#### Támogatott avatar csomagok
- **Racona natív**: .raconapkg formátum
- **Metaadatok**: Avatar név, verzió, szerző
- **Kompatibilitás**: Racona verzió követelmények
- **Biztonsági ellenőrzés**: Malware és vírus scan

### 3. AI Agent (Agent Settings)
**Elérési út:** AI Asszisztens → AI Agent

#### 3.1 AI Agent konfiguráció

##### AI szolgáltató beállítások
- **Szolgáltató választás**: OpenAI, Google Gemini, Anthropic, stb.
- **API kulcs**: Titkosított tárolás az adatbázisban
- **Model név**: Specifikus AI model megadása (opcionális)
- **Alapértelmezett modellek**: Szolgáltató alapértelmezett modelljei

##### Haladó beállítások
- **Alap URL**: Egyéni API végpont (opcionális)
- **Maximum tokenek**: Válasz hossz korlátozása
- **Hőmérséklet**: Kreativitás vs. konzisztencia beállítás
- **Kapcsolat tesztelés**: API elérhetőség ellenőrzése

#### 3.2 Tudásbázis (Knowledge Base)

##### Tudásbázis állapot
- **Összes dokumentum**: Indexelt dokumentumok száma
- **Összes chunk**: Feldolgozott szövegrészek száma
- **Üzemidő**: Tudásbázis szolgáltatás futási ideje
- **Utolsó indexelés**: Legutóbbi frissítés időpontja

##### Nyelvi részletek
- **Magyar (hu)**: Magyar nyelvű dokumentumok
- **Angol (en)**: Angol nyelvű dokumentumok
- **Betöltött állapot**: Memóriában elérhető-e
- **Dokumentum/chunk statisztikák**: Nyelvenként bontott adatok

##### Tudásbázis kezelés
- **Újraindexelés**: Teljes tudásbázis frissítése
- **Nyelv-specifikus újraindexelés**: Csak egy nyelv frissítése
- **Státusz frissítése**: Aktuális állapot lekérdezése
- **Hibaelhárítás**: Indexelési problémák kezelése

## Chat funkciók

### Beszélgetési felület
- **Üzenet bevitel**: Természetes nyelvi kérdések
- **Karakter limit**: Maximum karakterszám korlátozás
- **Küldés gomb**: Üzenet elküldése
- **Előzmények**: Korábbi beszélgetések megtekintése

### Válasz generálás
- **Tudásbázis keresés**: Releváns információk keresése
- **Kontextus építés**: Találatok alapján válasz készítés
- **Nyelvi támogatás**: Magyar és angol nyelvű válaszok
- **Forrás jelölés**: Keresési eredmények száma

### Érzelem választó
- **Avatar érzelmek**: Különböző hangulatok megjelenítése
- **Vizuális visszajelzés**: Avatar arckifejezés változtatása
- **Interaktivitás**: Felhasználói élmény fokozása

## Üdvözlő üzenetek

### Nyelv-specifikus üdvözlések
- **Magyar**: "Szia, {név} vagyok, miben segíthetek?"
- **Angol**: "Hi, I'm {név}, how can I help you?"
- **Alapértelmezett név**: "Asszisztens" ha nincs avatar kiválasztva
- **Személyre szabás**: Avatar név használata

### Első indítás
- **Üdvözlő üzenet**: Automatikus megjelenítés
- **Használati útmutató**: Hogyan tehetsz fel kérdéseket
- **Példa kérdések**: Javasolt kezdő kérdések

## Tudásbázis integráció

### Keresési mechanizmus
- **RAG (Retrieval-Augmented Generation)**: Tudásbázis alapú válaszok
- **Chunk-alapú keresés**: Szövegrészek intelligens keresése
- **Relevancia pontozás**: Legjobb találatok kiválasztása
- **Nyelvi fallback**: Ha nincs találat az adott nyelven

### Támogatott tartalmak
- **Racona dokumentáció**: Rendszer használati útmutatók
- **Alkalmazás leírások**: Beépített alkalmazások dokumentációja
- **Hibaelhárítás**: Gyakori problémák és megoldások
- **Fejlesztői információk**: API és fejlesztési útmutatók

### Keresési eredmények
- **Találatok száma**: Hány dokumentumból származik a válasz
- **Nyelvi jelölés**: Melyik nyelven találta az információt
- **Kontextus minőség**: Mennyire releváns a találat

## Hibaelhárítás

### AI Agent kapcsolódási problémák

#### API kulcs hibák
- **Hiányzó API kulcs**: "API kulcs megadása kötelező"
- **Érvénytelen kulcs**: Kapcsolat tesztelés sikertelen
- **Lejárt kulcs**: Szolgáltató oldali hiba
- **Megoldás**: Új API kulcs beszerzése és beállítása

#### Szolgáltató problémák
- **Szolgáltatás nem elérhető**: Hálózati vagy szolgáltató hiba
- **Rate limiting**: Túl sok kérés rövid idő alatt
- **Model nem támogatott**: Hibás model név megadása
- **Megoldás**: Szolgáltató státusz ellenőrzése, várakozás

#### Konfigurációs hibák
- **Hibás URL**: Egyéni API végpont nem elérhető
- **Protokoll hiba**: HTTP vs HTTPS problémák
- **Tűzfal blokkolás**: Hálózati hozzáférés korlátozása
- **Megoldás**: Beállítások ellenőrzése, hálózat konfiguráció

### Tudásbázis problémák

#### Indexelési hibák
- **Dokumentumok nem találhatók**: Fájlrendszer hozzáférési probléma
- **Parsing hiba**: Markdown feldolgozási probléma
- **Memória hiba**: Túl sok dokumentum egyszerre
- **Megoldás**: Újraindexelés, rendszer újraindítás

#### Keresési problémák
- **Nincs találat**: Tudásbázis üres vagy nem indexelt
- **Rossz minőségű válaszok**: Elavult vagy hiányos dokumentáció
- **Nyelvi problémák**: Nem megfelelő nyelvi fallback
- **Megoldás**: Tudásbázis frissítése, dokumentáció bővítése

### Avatar problémák

#### Telepítési hibák
- **Érvénytelen fájlformátum**: Nem .raconapkg fájl
- **Sérült csomag**: ZIP struktúra hibás
- **Kompatibilitási probléma**: Racona verzió nem megfelelő
- **Megoldás**: Megfelelő avatar csomag beszerzése

#### Megjelenítési problémák
- **Avatar nem jelenik meg**: Betöltési hiba
- **Animáció problémák**: Böngésző kompatibilitás
- **Teljesítmény problémák**: Túl nagy avatar fájlok
- **Megoldás**: Böngésző frissítése, kisebb avatar használata

### Chat problémák

#### Üzenet küldési hibák
- **Túl hosszú üzenet**: Karakter limit túllépése
- **Hálózati hiba**: Kapcsolódási probléma
- **Szerver hiba**: Backend szolgáltatás nem elérhető
- **Megoldás**: Rövidebb üzenet, kapcsolat ellenőrzése

#### Válasz generálási problémák
- **Lassú válaszok**: AI szolgáltató túlterhelt
- **Hiányos válaszok**: Tudásbázis korlátozott
- **Hibás válaszok**: AI model problémák
- **Megoldás**: Várakozás, kérdés átfogalmazása

## Biztonsági megfontolások

### API kulcs biztonság
- **Titkosított tárolás**: Adatbázisban kriptográfiai védelem
- **Hozzáférés korlátozás**: Csak jogosult felhasználók
- **Kulcs rotáció**: Rendszeres API kulcs csere
- **Audit napló**: API kulcs használat naplózása

### Adatvédelem
- **Chat előzmények**: Helyi tárolás, nem külső szerveren
- **Személyes adatok**: Minimális adatgyűjtés
- **Tudásbázis tartalom**: Csak nyilvános dokumentáció
- **GDPR megfelelőség**: Adatvédelmi szabályok betartása

### Külső szolgáltatások
- **AI szolgáltatók**: Megbízható partnerek választása
- **Adatátvitel**: HTTPS titkosítás
- **Adatmegosztás**: Minimális szükséges információ
- **Szolgáltatási feltételek**: AI szolgáltató szabályainak betartása

## Fejlesztői információk

### Avatar csomag struktúra
```
avatar.raconapkg/
├── manifest.json         # Avatar metaadatok
├── avatar.png           # Avatar kép
├── animations/          # Animációs fájlok
├── sounds/             # Hang fájlok (opcionális)
└── locales/            # Többnyelvű támogatás
```

### Manifest.json példa
```json
{
  "id": "my-avatar",
  "name": "My Avatar",
  "version": "1.0.0",
  "author": "Developer Name",
  "description": "Avatar leírása",
  "minRaconaVersion": "1.0.0",
  "defaultName": "Avatar Név",
  "supportedLanguages": ["hu", "en"]
}
```

### API integráció
- **OpenAI**: GPT modellek támogatása
- **Google Gemini**: Gemini modellek támogatása
- **Anthropic**: Claude modellek támogatása
- **Egyéni API**: Saját AI szolgáltatás integráció

### Tudásbázis formátum
- **Markdown fájlok**: .md kiterjesztésű dokumentumok
- **Frontmatter**: YAML metaadatok
- **Chunk méret**: Optimális szövegrész hossz
- **Indexelési stratégia**: Vektoros keresés