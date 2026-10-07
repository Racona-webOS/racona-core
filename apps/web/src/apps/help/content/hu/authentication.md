---
title: Bejelentkezés és hitelesítés
description: Hogyan jelentkezhet be a Racona rendszerbe és hogyan védheti meg fiókját
sidebar:
  order: 1
next:
  link: /hu/user/desktop-basics/
  label: A felület használata
---

## Bevezetés

A Racona egy zárt rendszer, amely csak hitelesített felhasználók számára érhető el. A rendszerbe való belépéshez érvényes felhasználói fiókkal kell rendelkezned. Ez az útmutató bemutatja a különböző bejelentkezési módokat, a fiók létrehozását, valamint a biztonsági funkciókat, amelyek segítenek megvédeni a fiókodat.

## Miért szükséges a bejelentkezés?

A Racona hitelesítési rendszere biztosítja, hogy:

- Csak jogosult felhasználók férjenek hozzá a rendszerhez
- Minden felhasználó saját személyre szabott környezettel rendelkezzen
- Az adatok és beállítások biztonságban legyenek
- A rendszer nyomon követhesse a felhasználói tevékenységeket

## Autentikáció

A Racona több bejelentkezési módszert is támogat az Ön kényelme érdekében.

![Placeholder: Bejelentkezési képernyő email/jelszó mezőkkel, email kód opcióval és Google bejelentkezés gombbal](../../../../assets/authentication/login.webp)
_A bejelentkezési képernyő az összes elérhető bejelentkezési móddal_

### Email/Jelszó bejelentkezés

A leggyakoribb bejelentkezési módszer az email cím és jelszó használatával.

**Lépések:**

1. Nyisd meg a Racona bejelentkezési oldalát
2. Add meg az email címedet az "E-mail cím" mezőbe
3. Add meg a jelszavadat a "Jelszó" mezőbe
4. Kattints a "Bejelentkezés" gombra

### Bejelentkezés e-mail kóddal

Az email OTP (egyszeri jelszó) bejelentkezés egy jelszó nélküli autentikációs módszer.

**Lépések:**

1. Nyisd meg a Racona bejelentkezési oldalát
2. Kattints a "Bejelentkezés e-mail kóddal" linkre
3. Add meg az email címedet
4. Kattints a "Kód küldése" gombra
5. Ellenőrizd az email fiókodat
6. Írd be a kapott egyszeri kódot
7. Kattints az "Ellenőrzés" gombra

### Bejelentkezés Google fiókkal

Ha a rendszergazda engedélyezte, Google fiókkal is bejelentkezhetsz.

**Lépések:**

1. Nyisd meg a Racona bejelentkezési oldalát
2. Kattints a "Bejelentkezés Google-lel" gombra
3. Válaszd ki a Google fiókodat
4. Engedélyezd a Racona számára a hozzáférést
5. Automatikusan bejelentkezel a Racona-ba

> **Megjegyzés:** Ha először jelentkezel be Google fiókkal, automatikusan létrejön egy új Racona felhasználói fiók az email címeddel. Ez a funkció nem minden telepítésnél érhető el.

### Regisztráció

Új felhasználói fiók létrehozása email ellenőrzéssel.

> **Tipp:** Ha Google fiókkal jelentkezel be először, nem kell külön regisztrálnod - automatikusan létrejön a fiókod.

**Email/jelszó regisztráció lépései:**

1. Nyisd meg a Racona bejelentkezési oldalát
2. Kattints a "Nincs még fiókod? Regisztrálj itt" linkre
3. Add meg a teljes nevedet
4. Add meg az email címedet
5. Válassz egy erős jelszót
6. Erősítsd meg a jelszót
7. Kattints a "Fiók létrehozása" gombra
8. Ellenőrizd az email fiókodat
9. Kattints az ellenőrző linkre az emailben
10. Az email cím megerősítése után bejelentkezhetsz

![Placeholder: Regisztrációs képernyő email és jelszó mezőkkel](../../../../assets/authentication/registration.webp)
_Regisztrációs űrlap a fiók létrehozásához_

### Jelszó visszaállítás

Ha elfelejtetted a jelszavadat, könnyen visszaállíthatod.

**Lépések:**

1. Nyisd meg a Racona bejelentkezési oldalát
2. Kattints az "Elfelejtette a jelszavát?" linkre
3. Add meg az email címedet
4. Kattints a "Jelszó visszaállítási link küldése" gombra
5. Ellenőrizd az email fiókodat
6. Kattints a visszaállítási linkre az emailben
7. Adj meg egy új jelszót
8. Erősítsd meg az új jelszót
9. Kattints a "Jelszó visszaállítása" gombra
10. Jelentkezz be az új jelszóval

![Placeholder: Jelszó visszaállítási képernyő email mező és küldés gombbal](../../../../assets/authentication/forgotten-password.webp)
_Jelszó visszaállítási kérelem küldése email címmel_

## Kétfaktoros hitelesítés (2FA)

A kétfaktoros hitelesítés extra biztonsági réteget ad a fiókodhoz. Bejelentkezés után a Beállítások alkalmazásban engedélyezheted ezt a funkciót.

**Mit nyújt a 2FA?**

- Extra védelem a fiókod számára
- Hitelesítő alkalmazás használata (pl. Google Authenticator, Authy)
- Tartalék kódok vészhelyzetre

**Hogyan működik?**

1. Engedélyezés után minden bejelentkezéskor meg kell adnod egy 6 számjegyű kódot
2. A kódot az autentikátor alkalmazás generálja
3. A kód 30 másodpercenként változik

![Placeholder: 2FA bejelentkezési képernyő 6 számjegyű kód mezővel](../../../../assets/authentication/2fa.webp)
_Kétfaktoros hitelesítés ellenőrzése bejelentkezéskor_

### Eszköz megbízhatónak jelölése

A 2FA bejelentkezési képernyőn lehetőséged van az "Eszköz megbízhatónak jelölése 30 napra" opció bekapcsolására.

**Mit jelent ez?**

- Ha bejelölöd ezt az opciót, a rendszer 30 napig nem kéri újra a 2FA kódot ezen az eszközön
- Ez kényelmes, ha saját, biztonságos eszközről jelentkezel be rendszeresen
- A 30 napos időszak után újra meg kell adnod a 2FA kódot
- Minden eszköz külön kezelhető - ha több eszközről is bejelentkezel, mindegyiken külön jelölheted meg

**Mikor használd?**

- Saját számítógépen vagy telefonon, amelyet csak te használsz
- Biztonságos környezetben, ahol mások nem férnek hozzá az eszközhöz

**Mikor NE használd?**

- Nyilvános vagy megosztott számítógépeken
- Munkahelyi eszközökön, amelyeket mások is használhatnak
- Olyan eszközökön, amelyek könnyen elveszhetnek vagy ellophatók

### Tartalék kódok használata

A 2FA beállításakor a rendszer tartalék (helyreállítási) kódokat generál a számodra.

**Miért fontosak a tartalék kódok?**

- Ha elveszíted vagy meghibásodik az autentikátor eszközöd, ezekkel a kódokkal továbbra is be tudsz jelentkezni
- Minden kód csak egyszer használható fel
- Általában 10 darab tartalék kódot kapsz

**Hogyan tárold biztonságosan?**

- Mentsd el őket biztonságos helyre (jelszókezelő, titkosított fájl)
- Nyomtasd ki és tárold biztonságos helyen (széf, zárt fiók)
- Ne tárold őket ugyanazon az eszközön, ahol az autentikátor alkalmazás van
- Soha ne oszd meg másokkal a tartalék kódokat

**Tartalék kód használata:**

1. A 2FA bejelentkezési képernyőn kattints a "Tartalék kód használata" linkre
2. Írd be az egyik fel nem használt tartalék kódot
3. A kód felhasználás után érvénytelenné válik
4. Bejelentkezés után azonnal állíts be új autentikátor eszközt vagy generálj új tartalék kódokat

> **Fontos:** Ha elfogytak a tartalék kódjaid, a Beállítások > Biztonság menüpontban bármikor generálhatsz újakat. Az új kódok generálása érvényteleníti a régi, fel nem használt kódokat.

> **Részletes útmutató:** A 2FA beállításának és kezelésének részletes leírását a Beállítások dokumentációban találod (hamarosan elérhető).

## Munkamenet-kezelés

### Automatikus munkamenet megőrzés

A Racona automatikusan megőrzi a munkamenetét, így nem kell minden alkalommal újra bejelentkezned.

- A rendszer biztonságosan tárolja a munkamenet információit
- A következő látogatáskor automatikusan bejelentkezel
- A munkamenet megőrzés a böngésző bezárása után is működik

### Kijelentkezés

Bármikor kijelentkezhetsz a rendszerből a Start Menü "Kijelentkezés" gomb megnyomásával.

**Lépések:**

1. Kattints a felhasználói profilra a tálcán
2. Válaszd a "Kijelentkezés" opciót
3. A rendszer azonnal kijelentkeztet és átirányít a bejelentkezési oldalra

### Munkamenet időtúllépés

Biztonsági okokból a munkamenetek bizonyos idő után lejárnak.

- A munkamenetek alapértelmezetten 7 napig érvényesek
- A rendszer automatikusan megújítja a munkamenetet, ha aktívan használod
- Lejárat után újra be kell jelentkezned
- Az időtúllépési időt a rendszergazda állítja be

> **Megjegyzés:** Az inaktivitás alapú automatikus kijelentkezés és a lejárat előtti figyelmeztetés funkciók jelenleg fejlesztés alatt állnak.

### Munkamenet korlátozás

A Racona biztonsági okokból egyszerre csak egy aktív munkamenetet engedélyez.

- Egyszerre csak egy eszközről vagy böngészőből lehet bejelentkezve
- Új bejelentkezés automatikusan kijelentkezteti a korábbi munkameneteket
- Ez megakadályozza a párhuzamos hozzáférést és növeli a biztonságot
- Ha másik eszközről jelentkezel be, az előző eszközön automatikusan kijelentkezel

## Első lépések az asztalon

Sikeres bejelentkezés után a Racona asztali környezete jelenik meg. Most már készen állsz a rendszer használatára.

### Mit fogsz látni

- **Asztal**: A fő munkaterület, ahol az alkalmazás ablakok megjelennek
- **Tálca**: Az alsó (vagy felső) sávon található, alkalmazás gombokkal és rendszer ikonokkal
- **Indító Panel**: Az alkalmazások indítására szolgáló menü
- **Asztali Parancsikonok**: Gyors hozzáférés a gyakran használt alkalmazásokhoz

![Placeholder: Asztali környezet első indításkor tálcával, indító panel gombbal és parancsikonokkal](../../../../assets/authentication/desktop.webp)
_Az Racona asztali környezete első indításkor_

### Következő lépések

Most, hogy bejelentkeztél, ismerkedj meg a felület használatával:

További információ: [A felület használata](../desktop-basics)

## Gyakori kérdések

**Nem kaptam meg az ellenőrző emailt. Mit tegyek?**

- Ellenőrizd a spam/levélszemét mappát
- Várj néhány percet, az email megérkezése időbe telhet
- Próbáld meg újra küldeni az ellenőrző emailt
- Ellenőrizd, hogy helyesen adtad-e meg az email címedet

**Elvesztettem a 2FA eszközömet. Hogyan jelentkezhetek be?**

- Használd a helyreállítási kódokat, amelyeket a 2FA beállításakor mentettél
- Ha nincs helyreállítási kódod, lépj kapcsolatba a rendszergazdával

**Miért jelentkeztet ki a rendszer automatikusan?**

- Ez a munkamenet időtúllépés biztonsági funkció
- Hosszabb inaktivitás után a rendszer automatikusan kijelentkeztet
- Egyszerűen jelentkezz be újra a folytatáshoz
