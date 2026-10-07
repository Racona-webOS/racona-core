---
title: Biztonság és hitelesítés
category: system
tags: [biztonság, security, jelszó, password, 2fa, hitelesítés, authentication]
aliases: [security, authentication, password, login, 2fa, two factor]
last_updated: 2026-04-19
---

# Biztonság és hitelesítés

## Rövid összefoglaló
A Racona rendszer többrétegű biztonsági funkciókat kínál: jelszó alapú hitelesítés, kétfaktoros hitelesítés (2FA), eszköz megbízhatóság és munkamenet kezelés.

## Bejelentkezési módok

### E-mail és jelszó
- **Alapértelmezett**: E-mail cím és jelszó kombináció
- **Jelszó követelmények**: Minimum 8 karakter, vegyes karakterek ajánlottak
- **Jelszó visszaállítás**: E-mail alapú visszaállítás

### E-mail OTP (Egyszeri jelszó)
- **Jelszó nélküli bejelentkezés**: Csak e-mail cím szükséges
- **OTP kód**: 6 számjegyű kód e-mailben
- **Érvényesség**: 10 perc
- **Biztonságos**: Nincs tárolható jelszó

### Google bejelentkezés
- **OAuth2**: Google fiók használata
- **Gyors hozzáférés**: Egy kattintásos bejelentkezés
- **Biztonságos**: Google biztonsági szabályai érvényesek

## Kétfaktoros hitelesítés (2FA)
**Elérési út:** Beállítások → Biztonság → Kétfaktoros hitelesítés

### 2FA beállítása
1. Nyisd meg a **Beállítások** → **Biztonság** menüt
2. Koppints a **Kétfaktoros hitelesítés** opcióra
3. **QR kód beolvasása**: Használj authenticator alkalmazást (Google Authenticator, Authy, stb.)
4. **Megerősítő kód**: Írd be a 6 számjegyű kódot
5. **Mentés**: 2FA aktiválva

### Backup kódok
- **Automatikus generálás**: 10 db egyszer használatos kód
- **Biztonságos tárolás**: Írd fel és tárold biztonságos helyen
- **Vészhelyzeti hozzáférés**: Ha nincs hozzáférés az authenticator alkalmazáshoz

### 2FA használata
1. **Normál bejelentkezés**: E-mail és jelszó
2. **2FA kód**: Írd be az authenticator alkalmazásból a 6 számjegyű kódot
3. **Backup kód**: Vészhelyzet esetén használj backup kódot

## Eszköz megbízhatóság

### Megbízható eszközök
**Elérési út:** Beállítások → Biztonság → Eszköz megbízhatóság

- **Eszköz megjelölése megbízhatónak**: Bejelentkezéskor "Eszköz megjegyzése" opció
- **30 napos érvényesség**: Megbízható eszközökön 30 napig nem kell 2FA
- **Eszköz lista**: Megtekinthető és kezelhető a megbízható eszközök listája

### Eszköz eltávolítása
1. Beállítások → Biztonság → Eszköz megbízhatóság
2. Válaszd ki az eszközt
3. **Eltávolítás**: Az eszköz többé nem megbízható

## Munkamenet kezelés

### Aktív munkamenetek
**Elérési út:** Beállítások → Biztonság → Aktív munkamenetek

- **Egy aktív munkamenet**: Csak egy helyen lehetsz bejelentkezve egyszerre
- **Automatikus kijelentkezés**: Új bejelentkezés kijelentkezteti a régit
- **Munkamenet információk**: IP cím, böngésző, időpont

### Kijelentkezés
- **Manuális**: Kijelentkezés gomb
- **Automatikus**: Böngésző bezárása vagy új bejelentkezés
- **Időkorlát**: Inaktivitás esetén automatikus kijelentkezés

## Jelszó kezelés

### Jelszó módosítása
**Elérési út:** Beállítások → Biztonság → Jelszó módosítása

1. **Jelenlegi jelszó**: Add meg a jelenlegi jelszót
2. **Új jelszó**: Írd be az új jelszót
3. **Megerősítés**: Írd be újra az új jelszót
4. **Mentés**: Jelszó frissítve

### Erős jelszó ajánlások
- **Minimum 8 karakter**
- **Vegyes karakterek**: Nagy- és kisbetűk, számok, speciális karakterek
- **Egyedi**: Ne használd máshol
- **Jelszókezelő**: Használj jelszókezelő alkalmazást

## Adatvédelem és GDPR

### Adatkezelés
- **Minimális adatgyűjtés**: Csak a szükséges adatok
- **Helyi tárolás**: Adatok a saját szerveren
- **Titkosítás**: Jelszavak hash-elve tárolva
- **Hozzáférés**: Csak te férsz hozzá az adataidhoz

### Adatok törlése
**Elérési út:** Beállítások → Fiók → Fiók törlése

- **Teljes törlés**: Minden adat véglegesen törlődik
- **Visszavonhatatlan**: A művelet nem visszavonható
- **Megerősítés**: Jelszó szükséges a törléshez

## Biztonsági tippek

### Általános biztonság
- **Rendszeres jelszó frissítés**: 3-6 havonta
- **2FA használata**: Mindig kapcsold be
- **Megbízható eszközök**: Csak saját eszközökön
- **Kijelentkezés**: Mindig jelentkezz ki közös számítógépeken

### Gyanús tevékenység
- **Ismeretlen bejelentkezés**: Ellenőrizd az aktív munkameneteket
- **Váratlan kijelentkezés**: Lehet, hogy máshol jelentkeztek be
- **E-mail értesítések**: Figyelj a biztonsági e-mailekre

## Hibaelhárítás

**Nem tudok bejelentkezni:**
→ Ellenőrizd az e-mail címet és jelszót
→ Próbáld meg a jelszó visszaállítást
→ Ellenőrizd a 2FA kódot (ha be van kapcsolva)

**2FA kód nem működik:**
→ Ellenőrizd az eszköz óráját (szinkronizáció)
→ Próbáld meg a backup kódot
→ Generálj új QR kódot

**Kizárva az eszközömről:**
→ Használj másik megbízható eszközt
→ Használj backup kódot
→ Lépj kapcsolatba az adminisztrátorral

**Elfelejtett jelszó:**
→ Használd a "Jelszó visszaállítása" linket
→ Ellenőrizd az e-mail fiókot (spam mappa is)
→ Próbáld meg az OTP bejelentkezést