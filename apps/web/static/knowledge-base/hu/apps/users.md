---
title: Felhasználók alkalmazás
category: apps
tags: [felhasználók, csoportok, szerepkörök, jogosultságok, erőforrások, hozzáférés, kezelés, admin, biztonság]
aliases: [users, user management, felhasználó kezelés, hozzáférés kezelés, access management, jogosultság kezelés]
last_updated: 2025-01-20
---

# Felhasználók alkalmazás

## Rövid összefoglaló
A Felhasználók alkalmazás a Racona rendszer teljes felhasználó- és hozzáférés-kezelési központja. Itt kezelheted a felhasználókat, csoportokat, szerepköröket, jogosultságokat és erőforrásokat.

## Alkalmazás elérése
**Elérési út:** Indító menü → Felhasználók
**Ikon:** Felhasználók
**Jogosultság:** Adminisztrátori jogosultságok szükségesek

## Főmenü struktúra

### 1. Felhasználók (Users)
**Elérési út:** Felhasználók → Felhasználók
**Jogosultság:** `users.users.view`

#### Felhasználók lista
- **Oszlopok**:
  - **Teljes név**: Felhasználó megjelenített neve
  - **E-mail cím**: Bejelentkezési e-mail
  - **Felhasználónév**: Egyedi azonosító
  - **E-mail megerősítve**: Verifikációs állapot
  - **Regisztráció dátuma**: Fiók létrehozás időpontja
  - **Állapot**: Aktív/Inaktív
  - **Provider**: Bejelentkezési módszer

#### Szűrési lehetőségek
- **Keresés**: Név vagy e-mail alapján
- **Állapot szűrés**: Aktív/inaktív felhasználók
- **Provider szűrés**: E-mail/jelszó, Google, Facebook, GitHub
- **Szűrők törlése**: Összes szűrő visszaállítása

#### Provider típusok
- **E-mail/jelszó**: Hagyományos regisztráció
- **Google**: Google OAuth bejelentkezés
- **Facebook**: Facebook OAuth bejelentkezés
- **GitHub**: GitHub OAuth bejelentkezés

### 2. Hozzáférés-kezelés (Access Management)
**Elérési út:** Felhasználók → Hozzáférés-kezelés

#### 2.1 Csoportok (Groups)
**Elérési út:** Felhasználók → Hozzáférés-kezelés → Csoportok
**Jogosultság:** `users.groups.view`

##### Csoportok lista
- **Oszlopok**:
  - **Csoport neve**: Csoport megjelenített neve
  - **Leírás**: Csoport céljának ismertetése
  - **Létrehozás dátuma**: Csoport létrehozásának időpontja

##### Csoport műveletek
- **Új csoport**: Új csoport létrehozása
- **Részletek**: Csoport információk és tagok megtekintése
- **Szerkesztés**: Csoport adatok módosítása
- **Törlés**: Csoport eltávolítása

#### 2.2 Szerepkörök (Roles)
**Elérési út:** Felhasználók → Hozzáférés-kezelés → Szerepkörök
**Jogosultság:** `users.roles.view`

##### Szerepkörök lista
- **Oszlopok**:
  - **Szerepkör neve**: Szerepkör megjelenített neve
  - **Leírás**: Szerepkör céljának ismertetése
  - **Létrehozás dátuma**: Szerepkör létrehozásának időpontja

##### Szerepkör műveletek
- **Új szerepkör**: Új szerepkör létrehozása
- **Részletek**: Szerepkör információk és jogosultságok
- **Szerkesztés**: Szerepkör adatok módosítása
- **Törlés**: Szerepkör eltávolítása

#### 2.3 Jogosultságok (Permissions)
**Elérési út:** Felhasználók → Hozzáférés-kezelés → Jogosultságok
**Jogosultság:** `users.permissions.view`

##### Jogosultságok lista
- **Oszlopok**:
  - **Jogosultság neve**: Jogosultság azonosítója
  - **Leírás**: Jogosultság funkcionalitásának leírása
  - **Erőforrás**: Kapcsolódó védett erőforrás
  - **Létrehozás dátuma**: Jogosultság definiálásának időpontja

#### 2.4 Erőforrások (Resources)
**Elérési út:** Felhasználók → Hozzáférés-kezelés → Erőforrások
**Jogosultság:** `users.resources.view`

##### Erőforrások lista
- **Oszlopok**:
  - **Erőforrás neve**: Védett erőforrás azonosítója
  - **Leírás**: Erőforrás funkcionalitásának leírása
  - **Létrehozás dátuma**: Erőforrás definiálásának időpontja

## Felhasználó részletek kezelése

### Alapvető információk
- **Teljes név**: Szerkeszthető megjelenített név
- **Felhasználónév**: Egyedi azonosító (szerkeszthető)
- **E-mail cím**: Csak olvasható (provider-től függ)
- **Fiók típusa**: Google fiók vagy e-mail fiók
- **Regisztráció dátuma**: Fiók létrehozásának időpontja

### Fiók állapot kezelése
- **Aktív állapot**: Felhasználó bejelentkezhet
- **Inaktív állapot**: Bejelentkezés letiltva
- **Aktiválás**: Inaktív felhasználó újra engedélyezése
- **Inaktiválás**: Aktív felhasználó letiltása

### Csoportok kezelése
- **Jelenlegi csoportok**: Felhasználó csoporttagságai
- **Csoport hozzáadása**: Új csoporthoz rendelés
- **Csoport eltávolítása**: Csoporttagság megszüntetése
- **Keresés**: Elérhető csoportok keresése

### Szerepkörök kezelése
- **Jelenlegi szerepkörök**: Felhasználó szerepkör-hozzárendelései
- **Szerepkör hozzáadása**: Új szerepkör hozzárendelése
- **Szerepkör eltávolítása**: Szerepkör-hozzárendelés megszüntetése
- **Keresés**: Elérhető szerepkörök keresése

## Csoport részletek kezelése

### Csoport információk
- **Csoport neve**: Szerkeszthető megjelenített név
- **Leírás**: Csoport céljának és funkcionalitásának leírása
- **Létrehozás dátuma**: Csoport létrehozásának időpontja

### Csoport tagok
- **Tagok listája**: Csoporthoz tartozó felhasználók
- **Tag hozzáadása**: Új felhasználó csoporthoz rendelése
- **Tag eltávolítása**: Felhasználó csoportból való kivétele
- **Keresés**: Elérhető felhasználók keresése

### Csoport jogosultságok
- **Jogosultságok listája**: Csoporthoz rendelt jogosultságok
- **Jogosultság hozzáadása**: Új jogosultság csoporthoz rendelése
- **Jogosultság eltávolítása**: Jogosultság csoportból való kivétele
- **Keresés**: Elérhető jogosultságok keresése

## Szerepkör részletek kezelése

### Szerepkör információk
- **Szerepkör neve**: Szerkeszthető megjelenített név
- **Leírás**: Szerepkör céljának és funkcionalitásának leírása
- **Létrehozás dátuma**: Szerepkör létrehozásának időpontja

### Szerepkör jogosultságok
- **Jogosultságok listája**: Szerepkörhöz rendelt jogosultságok
- **Jogosultság hozzáadása**: Új jogosultság szerepkörhöz rendelése
- **Jogosultság eltávolítása**: Jogosultság szerepkörből való kivétele
- **Keresés**: Elérhető jogosultságok keresése

### Szerepkör tagok
- **Tagok listája**: Szerepkörrel rendelkező felhasználók
- **Tag hozzáadása**: Új felhasználó szerepkörhöz rendelése
- **Tag eltávolítása**: Felhasználó szerepkörből való kivétele
- **Keresés**: Elérhető felhasználók keresése

## Új entitások létrehozása

### Új csoport létrehozása
1. **"Új csoport" gomb**: Csoportok listában
2. **Csoport neve**: Egyedi, beszédes név megadása
3. **Leírás**: Csoport céljának ismertetése
4. **Létrehozás**: Megerősítés és mentés
5. **Tagok hozzáadása**: Felhasználók csoporthoz rendelése

### Új szerepkör létrehozása
1. **"Új szerepkör" gomb**: Szerepkörök listában
2. **Szerepkör neve**: Egyedi, beszédes név megadása
3. **Leírás**: Szerepkör céljának ismertetése
4. **Létrehozás**: Megerősítés és mentés
5. **Jogosultságok hozzáadása**: Engedélyek szerepkörhöz rendelése

## Törlési műveletek

### Felhasználó inaktiválása/törlése
- **Inaktiválás**: Bejelentkezés letiltása (visszafordítható)
- **Törlés**: Teljes felhasználó eltávolítása (visszafordíthatatlan)
- **Megerősítés**: Biztonsági kérdés kötelező
- **Következmények**: Adatvesztés és hozzáférés megszűnése

### Csoport törlése
- **Előfeltétel**: Csoport tagok eltávolítása
- **Jogosultságok**: Automatikus jogosultság-hozzárendelések törlése
- **Megerősítés**: "Ez a művelet nem vonható vissza"
- **Következmények**: Összes kapcsolódó hozzárendelés törlése

### Szerepkör törlése
- **Előfeltétel**: Szerepkör tagok eltávolítása
- **Jogosultságok**: Automatikus jogosultság-hozzárendelések törlése
- **Megerősítés**: "Ez a művelet nem vonható vissza"
- **Következmények**: Összes kapcsolódó hozzárendelés törlése

## Hozzáférés-kezelési koncepciók

### Felhasználók (Users)
- **Alapegység**: Egyéni személyek a rendszerben
- **Azonosítás**: E-mail cím és felhasználónév
- **Hitelesítés**: Jelszó vagy OAuth provider
- **Állapot**: Aktív vagy inaktív

### Csoportok (Groups)
- **Cél**: Felhasználók logikai csoportosítása
- **Használat**: Szervezeti egységek, projektek, funkcionális csoportok
- **Jogosultságok**: Csoportszintű engedélyek
- **Öröklés**: Tagok automatikusan megkapják a csoport jogosultságait

### Szerepkörök (Roles)
- **Cél**: Funkcionális jogosultság-csomagok
- **Használat**: Munkaköri feladatok, felelősségi körök
- **Jogosultságok**: Szerepkör-specifikus engedélyek
- **Hozzárendelés**: Felhasználókhoz és csoportokhoz rendelhető

### Jogosultságok (Permissions)
- **Cél**: Konkrét műveletek engedélyezése
- **Granularitás**: Finomhangolt hozzáférés-szabályozás
- **Erőforrások**: Védett rendszerelemekhez kapcsolódnak
- **Öröklés**: Csoportokon és szerepkörökön keresztül

### Erőforrások (Resources)
- **Cél**: Védett rendszerelemek definiálása
- **Típusok**: Alkalmazások, adatok, funkciók
- **Védelem**: Jogosultság-alapú hozzáférés-szabályozás
- **Hierarchia**: Szülő-gyermek kapcsolatok

## Hibaelhárítás

### Felhasználó nem tud bejelentkezni
- **Állapot ellenőrzése**: Aktív-e a felhasználó
- **E-mail verifikáció**: Megerősített-e az e-mail cím
- **Jelszó reset**: Jelszó visszaállítási folyamat
- **Provider probléma**: OAuth szolgáltató elérhetősége

### Jogosultság hibák
- **Csoport tagság**: Megfelelő csoporthoz tartozik-e
- **Szerepkör hozzárendelés**: Van-e megfelelő szerepköre
- **Jogosultság öröklés**: Csoport/szerepkör jogosultságai
- **Erőforrás védelem**: Védett-e az adott erőforrás

### Adatok nem mentődnek
- **Jogosultságok**: Van-e szerkesztési jog
- **Validáció**: Megfelelő-e az adatformátum
- **Egyediség**: Nem ütközik-e meglévő adatokkal
- **Hálózat**: Kapcsolódási problémák

### Törlési problémák
- **Függőségek**: Vannak-e kapcsolódó elemek
- **Jogosultságok**: Van-e törlési jog
- **Megerősítés**: Helyes-e a megerősítési folyamat
- **Rendszer állapot**: Nincs-e karbantartási mód

## Biztonsági megfontolások

### Felhasználó kezelés
- **Minimális jogosultság elve**: Csak szükséges jogok adása
- **Rendszeres felülvizsgálat**: Jogosultságok időszakos ellenőrzése
- **Inaktív fiókok**: Nem használt fiókok inaktiválása
- **Erős hitelesítés**: 2FA használatának ösztönzése

### Csoport és szerepkör tervezés
- **Funkcionális elkülönítés**: Feladatok szerinti csoportosítás
- **Hierarchikus struktúra**: Logikus jogosultság-öröklés
- **Dokumentáció**: Csoportok és szerepkörök céljának leírása
- **Változáskövetés**: Módosítások naplózása

### Jogosultság kezelés
- **Granularitás**: Finomhangolt jogosultság-szabályozás
- **Explicit engedélyek**: Világos jogosultság-definíciók
- **Rendszeres audit**: Jogosultságok felülvizsgálata
- **Automatikus lejárat**: Időkorlátozott jogosultságok

### Adatvédelem
- **Személyes adatok**: GDPR megfelelőség
- **Adatminimalizálás**: Csak szükséges adatok tárolása
- **Hozzáférés naplózása**: Ki mit ért el és mikor
- **Adattörlés**: Felhasználó kérésére adatok törlése