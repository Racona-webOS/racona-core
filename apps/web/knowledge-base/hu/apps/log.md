---
title: Napló alkalmazás
category: apps
tags: [napló, log, hiba, error, aktivitás, activity, rendszer, monitoring, hibaelhárítás, audit]
aliases: [log, logging, naplózás, hibanapló, error log, activity log, rendszernapló, audit napló]
last_updated: 2025-01-20
---

# Napló alkalmazás

## Rövid összefoglaló
A Napló alkalmazás a Racona rendszer központi naplózási és monitoring központja. Itt megtekintheted a rendszer hibáit, felhasználói aktivitásokat és rendszeresemények részletes információit.

## Alkalmazás elérése
**Elérési út:** Indító menü → Napló
**Ikon:** Pajzs riasztás ikon
**Jogosultság:** Egyes funkciók adminisztrátori jogot igényelnek

## Főmenü struktúra

### 1. Hiba (Error)
**Elérési út:** Napló → Hiba
**Jogosultság:** `log.error.view`

#### Hiba napló lista
- **Oszlopok**:
  - **Szint**: Hiba súlyossági szintje (Error, Warning, Info, Debug)
  - **Üzenet**: Hiba rövid leírása
  - **Forrás**: Hiba származási helye (komponens, fájl)
  - **Időpont**: Hiba bekövetkezésének pontos ideje
  - **URL**: Kérés URL-je (ha webes hiba)

#### Szűrési lehetőségek
- **Szint szűrés**: Összes szint vagy specifikus szint kiválasztása
- **Forrás szűrés**: Komponens vagy fájl alapján szűrés
- **Időszak szűrés**: Dátum tartomány megadása
- **Szűrők visszaállítása**: Összes szűrő törlése

#### Hiba szintek
- **Error**: Kritikus hibák, amelyek működési problémát okoznak
- **Warning**: Figyelmeztetések, potenciális problémák
- **Info**: Információs üzenetek, normál működés
- **Debug**: Fejlesztői információk, részletes nyomkövetés

### 2. Aktivitás (Activity)
**Elérési út:** Napló → Aktivitás

#### Aktivitás napló lista
- **Oszlopok**:
  - **Művelet**: Végrehajtott tevékenység típusa
  - **Felhasználó**: Műveletet végrehajtó felhasználó
  - **Erőforrás**: Érintett rendszerelem vagy objektum
  - **Időpont**: Művelet végrehajtásának ideje

#### Szűrési lehetőségek
- **Felhasználó szűrés**: Specifikus felhasználó tevékenységei
- **Művelet szűrés**: Művelet típus alapján szűrés
- **Erőforrás szűrés**: Érintett erőforrás alapján
- **Időszak szűrés**: Dátum tartomány megadása

#### Tipikus műveletek
- **Bejelentkezés/Kijelentkezés**: Felhasználói session események
- **Fájl műveletek**: Feltöltés, törlés, módosítás
- **Beállítás változtatások**: Konfiguráció módosítások
- **Alkalmazás telepítés/eltávolítás**: Plugin műveletek
- **Felhasználó kezelés**: User management műveletek

## Hiba napló részletek

### Alapvető információk
- **Hiba szint**: Súlyossági kategória
- **Üzenet**: Részletes hibaüzenet
- **Forrás**: Hiba származási komponense
- **Időpont**: Pontos timestamp
- **URL**: Kérés útvonala (webes hibák esetén)

### Technikai részletek
- **HTTP metódus**: GET, POST, PUT, DELETE, stb.
- **Útvonal (Route ID)**: SvelteKit route azonosító
- **Felhasználó ID**: Hiba okozójának azonosítója (ha van)
- **User Agent**: Böngésző és eszköz információ
- **Stack trace**: Részletes hiba nyomkövetés
- **Kontextus**: További környezeti információk

### Hiba kezelési műveletek
- **Részletek megtekintése**: Teljes hiba információ
- **Hiba törlése**: Napló bejegyzés eltávolítása
- **Exportálás**: Hiba adatok mentése
- **Kapcsolódó hibák**: Hasonló hibák keresése

## Aktivitás napló részletek

### Művelet információk
- **Művelet típus**: Tevékenység kategóriája
- **Művelet leírás**: Részletes tevékenység leírás
- **Eredmény**: Sikeres vagy sikertelen végrehajtás
- **Időtartam**: Művelet végrehajtási ideje

### Felhasználói információk
- **Felhasználó ID**: Egyedi felhasználó azonosító
- **Felhasználó név**: Megjelenített név
- **IP cím**: Kérés forrás IP címe
- **Session ID**: Munkamenet azonosító

### Erőforrás információk
- **Erőforrás típus**: Objektum kategória (user, file, setting, stb.)
- **Erőforrás ID**: Egyedi objektum azonosító
- **Erőforrás név**: Objektum megjelenített neve
- **Változtatások**: Módosított mezők és értékek

## Napló kezelési műveletek

### Szűrés és keresés
- **Gyors szűrők**: Előre definiált szűrő kombinációk
- **Összetett keresés**: Több kritérium kombinálása
- **Mentett szűrők**: Gyakran használt szűrők mentése
- **Exportálás**: Szűrt eredmények letöltése

### Napló karbantartás
- **Automatikus törlés**: Régi bejegyzések automatikus eltávolítása
- **Manuális törlés**: Kiválasztott bejegyzések törlése
- **Archiválás**: Régi naplók hosszú távú tárolása
- **Méret monitoring**: Napló fájlok méretének figyelése

### Riasztások és értesítések
- **Kritikus hibák**: Azonnali értesítés súlyos hibákról
- **Trend monitoring**: Hibák számának növekedése
- **Teljesítmény riasztások**: Lassú műveletek észlelése
- **Biztonsági események**: Gyanús tevékenységek jelzése

## Hibaelhárítás és monitoring

### Gyakori hiba típusok

#### Alkalmazás hibák
- **JavaScript hibák**: Frontend kód problémák
- **API hibák**: Backend szolgáltatás problémák
- **Adatbázis hibák**: SQL és kapcsolódási problémák
- **Fájlrendszer hibák**: Fájl hozzáférési problémák

#### Hálózati hibák
- **Kapcsolódási hibák**: Szerver elérhetőségi problémák
- **Timeout hibák**: Lassú válaszidők
- **CORS hibák**: Cross-origin kérés problémák
- **SSL/TLS hibák**: Titkosítási problémák

#### Felhasználói hibák
- **Hitelesítési hibák**: Bejelentkezési problémák
- **Jogosultsági hibák**: Hozzáférés megtagadás
- **Validációs hibák**: Hibás adatbevitel
- **Session hibák**: Munkamenet problémák

### Hiba diagnosztika

#### Hiba elemzés lépései
1. **Hiba azonosítás**: Pontos hibaüzenet és kód
2. **Kontextus gyűjtés**: Környezeti információk
3. **Reprodukálás**: Hiba újra előidézése
4. **Gyökérok elemzés**: Valódi ok megtalálása
5. **Megoldás implementálás**: Javítás végrehajtása

#### Monitoring metrikák
- **Hiba gyakoriság**: Hibák száma időegységenként
- **Hiba típusok**: Leggyakoribb hiba kategóriák
- **Érintett felhasználók**: Hány felhasználót érint
- **Rendszer teljesítmény**: Válaszidők és erőforrás használat

### Proaktív monitoring

#### Trend elemzés
- **Hiba növekedés**: Hibák számának változása
- **Teljesítmény romlás**: Lassulási trendek
- **Felhasználói aktivitás**: Használati minták
- **Rendszer terhelés**: Erőforrás kihasználtság

#### Riasztási szabályok
- **Küszöbértékek**: Kritikus értékek meghatározása
- **Időablakok**: Monitoring időszakok
- **Eszkaláció**: Riasztás továbbítási szabályok
- **Automatikus műveletek**: Öngyógyító mechanizmusok

## Biztonsági megfontolások

### Napló biztonság
- **Hozzáférés korlátozás**: Csak jogosult felhasználók
- **Adattitkosítás**: Érzékeny információk védelme
- **Integritás védelem**: Napló módosítás megakadályozása
- **Backup és helyreállítás**: Napló adatok biztonsági mentése

### Adatvédelem
- **Személyes adatok**: GDPR megfelelőség
- **Adatminimalizálás**: Csak szükséges információk naplózása
- **Adatmegőrzés**: Napló adatok életciklusa
- **Anonimizálás**: Személyes azonosítók eltávolítása

### Audit követelmények
- **Megfelelőségi naplózás**: Szabályozási követelmények
- **Változáskövetés**: Rendszer módosítások dokumentálása
- **Hozzáférés naplózás**: Ki mit ért el és mikor
- **Jelentéskészítés**: Audit jelentések generálása

## Teljesítmény optimalizálás

### Napló teljesítmény
- **Indexelés**: Gyors keresés biztosítása
- **Particionálás**: Nagy naplók felosztása
- **Tömörítés**: Tárhely optimalizálás
- **Cachelés**: Gyakori lekérdezések gyorsítása

### Skálázhatóság
- **Horizontális skálázás**: Több szerver használata
- **Aszinkron feldolgozás**: Nem blokkoló naplózás
- **Batch feldolgozás**: Tömeges műveletek optimalizálása
- **Erőforrás monitoring**: Rendszer terhelés figyelése

## Integráció és API

### Külső rendszerek
- **SIEM integráció**: Biztonsági információ és eseménykezelés
- **Monitoring eszközök**: Prometheus, Grafana, stb.
- **Riasztási rendszerek**: E-mail, SMS, Slack értesítések
- **Backup rendszerek**: Automatikus napló mentés

### API végpontok
- **Napló lekérdezés**: REST API a napló adatok eléréséhez
- **Szűrés és keresés**: Programozható napló keresés
- **Riasztás kezelés**: Riasztási szabályok API-n keresztül
- **Exportálás**: Napló adatok programozott exportálása