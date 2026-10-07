---
title: Ablakkezelés
description: Ablakok kezelése és vezérlése a Racona-ben
sidebar:
  order: 2
---

Az ablakkezelés a Racona egyik alapvető funkciója. Ez az útmutató bemutatja, hogyan kezelheti az ablakokat hatékonyan.

## Mi az az ablak?

Az ablak egy téglalap alakú terület az asztalon, amely egy futó alkalmazás felületét jeleníti meg. Minden alkalmazás saját ablakban fut, így több alkalmazást használhat egyidejűleg.

## Az ablak felépítése

Egy ablak a következő részekből áll:

![Placeholder: Ablak felépítése - fejléc, vezérlő gombok, tartalom terület és átméretező fogantyúk kiemelve](../../../../../assets/desktop/window.webp)
_Egy ablak felépítése és fő részei_

- **Fejléc (1)**: Az ablak tetején található sáv, amely az alkalmazás nevét mutatja. A fejléc megragadásával mozgathatja az ablakot.
- **Vezérlő gombok (2)**: A címsor jobb oldalán található gombok az ablak kezeléséhez (minimalizálás, maximalizálás, bezárás stb.)
- **Tartalom terület (3)**: Az ablak fő része, ahol az alkalmazás felülete jelenik meg
- **Átméretező fogantyúk (4)**: Az ablak szélein és sarkain található láthatatlan területek, amelyekkel átméretezheti az ablakot

## Ablakok húzása

Az ablakokat szabadon mozgathatod az asztalon:

1. Kattints az ablak fejlécére
2. Tartsd lenyomva az egér gombját
3. Húzd az ablakot a kívánt helyre
4. Engedd el az egér gombját

**Fontos:** Az ablakok mindig az asztal területén belül maradnak - nem húzhatók ki a látható területről. A rendszer automatikusan korlátozza a mozgatást, hogy az ablak teljes egészében látható maradjon.

**Ablak rázás funkció:** Ha gyorsan jobbra-balra rázol egy ablakot (3 irányváltás 1 másodpercen belül), az összes többi ablak automatikusan minimalizálódik, így csak az aktív ablak marad az asztalon.

## Ablak átméretezése

Az ablakok méretét igény szerint módosíthatod:

1. Vidd az egeret az ablak szélére vagy sarkára
2. Az egérmutató átméretező kurzorrá változik
3. Kattints és húzd a szélét a kívánt irányba
4. Engedd el az egér gombját

### Méretezési korlátozások

Az alkalmazások fejlesztői meghatározhatják az ablakok méretezési korlátait:

- **Minimális méret**: Az ablak nem tehető kisebbre egy meghatározott méretnél
- **Maximális méret**: Az ablak nem tehető nagyobbra egy meghatározott méretnél
- **Méretezés tiltása**: Egyes alkalmazások esetében a méretezés teljesen le lehet tiltva
- **Maximalizálás tiltása**: Az ablak nem maximalizálható teljes képernyőre

Ezek a korlátozások biztosítják, hogy az alkalmazás felülete mindig megfelelően jelenjen meg és használható maradjon.

### Gyors méretezés dupla kattintással

Dupla kattintással az ablak szélein vagy sarkain gyorsan kitöltheti az ablakot az adott irányba:

- **Felső él**: Az ablak kitöltődik felfelé az asztal tetejéig
- **Alsó él**: Az ablak kitöltődik lefelé az asztal aljáig
- **Bal él**: Az ablak kitöltődik balra az asztal bal széléig
- **Jobb él**: Az ablak kitöltődik jobbra az asztal jobb széléig
- **Sarkok**: Az ablak kitöltődik mindkét irányba (pl. jobb felső sarok: jobbra és felfelé)

**Automatikus maximalizálás:** Ha az ablak mérete eléri az asztal 99%-át szélességben ÉS magasságban egyaránt, automatikusan maximalizált állapotra vált.

## Ablak vezérlő gombok

Az ablak jobb felső sarkában található vezérlő gombok:

![Placeholder: Ablak vezérlő gombok az ablak jobb felső sarkában - súgó, link, minimalizálás, maximalizálás, bezárás](../../../../../assets/desktop/window-functions.webp)
_Az ablak vezérlő gombjai színekkel és funkciókkal_

- **Súgó gomb (?)** - Kék színű: Megnyitja az alkalmazás súgóját (ha elérhető)
- **Link gomb** - Türkiz színű: Vágólapra másolja az alkalmazás megnyitásához szükséges linket
- **Minimalizálás (-)** - Sárga színű: Elrejti az ablakot, de az alkalmazás fut tovább
- **Maximalizálás/Visszaállítás** - Zöld színű: Teljes képernyőre nagyítja vagy visszaállítja az eredeti méretre
- **Bezárás (X)** - Piros színű: Bezárja az ablakot és leállítja az alkalmazást

**Megjegyzés:** Inaktív ablakoknál a gombok ikonjai csak akkor jelennek meg, ha az egeret a gomb fölé viszi.

## Minimalizálás

Az ablak minimalizálása elrejti azt az asztalról, de az alkalmazás továbbra is fut:

1. Kattints a minimalizálás gombra az ablak jobb felső sarkában (sárga gomb, mínusz ikon)
2. Az ablak eltűnik az asztalról
3. Az alkalmazás gombja továbbra is látható a tálcán

**Visszaállítás:** Kattints az alkalmazás gombjára a tálcán a minimalizált ablak visszaállításához.

![Placeholder: Minimalizált ablak a tálcán, alkalmazás gomb kiemelve](../../../../../assets/desktop/min.webp)
_Minimalizált alkalmazás gombja a tálcán_

## Maximalizálás

Az ablak maximalizálása kitölti a teljes képernyőt:

1. Kattints a maximalizálás gombra az ablak jobb felső sarkában (zöld gomb, négyzet ikon)
2. Az ablak kitölti a teljes képernyőt
3. A visszaállításhoz kattints újra a gombra (most két négyzet ikon jelenik meg)
4. Az ablak visszatér az eredeti méretére

**Gyors maximalizálás:** Dupla kattintás az ablak fejlécén.

## Bezárás

Az ablak bezárása leállítja az alkalmazást:

1. Kattints a bezárás gombra az ablak jobb felső sarkában (piros gomb, X ikon)
2. Az ablak bezárul
3. Az alkalmazás leáll
4. Az alkalmazás gombja eltűnik a tálcáról

## Súgó gomb

Egyes alkalmazások rendelkeznek beépített súgó funkcióval:

- A súgó gomb az ablak címsorában jelenik meg, a funkciógombok első helyén (kék gomb, ? ikon)
- Ez egy opcionális gomb - csak akkor látható, ha az adott alkalmazáshoz tartozik súgó dokumentáció
- A súgó gombra kattintva egy külön Súgó alkalmazás nyílik meg
- A Súgó alkalmazás az adott alkalmazás részletes ismertetőjét és használati útmutatóját tartalmazza
- Így gyorsan hozzáférhet a kontextusfüggő segítséghez anélkül, hogy elhagyná az alkalmazást

## Link gomb (Alkalmazás megosztás)

A Link gomb lehetővé teszi, hogy megossd egy alkalmazást annak aktuális állapotával más felhasználókkal:

### Hogyan működik?

1. Kattints a Link gombra az ablak címsorában (türkiz gomb, link ikon)
2. A rendszer automatikusan generál egy egyedi GUID hivatkozást
3. A hivatkozás tartalmazza az alkalmazás nevét és az aktuális állapotát (pl. melyik menüponton van)
4. A hivatkozás automatikusan a vágólapra kerül
5. Sikeres másolásról értesítést kapsz

### Mire használható?

- Konkrét beállítások megosztása kollégákkal - nem kell elmagyarázni, hogy "nyisd meg a Beállítások alkalmazást, keresd meg az XY menüpontot", hanem egyszerűen elkülded a linket
- Hibajelentések pontosítása - ha egy adott menüpontban találsz hibát, megoszthatod a pontos helyet
- Oktatási célok - gyorsan navigálhatsz másokat egy adott funkcióhoz
- Csapatmunka támogatása - egyszerűsíti a kommunikációt az alkalmazások használatáról

> **Megjegyzés:** A GUID hivatkozás tömörített formátumban tárolja az információkat, így biztonságosan megosztható és nem tartalmaz érzékeny adatokat. A hivatkozás megnyitásáról bővebben a [Tálca - Alkalmazás Megnyitó](./taskbar/#alkalmazás-megnyitó-guid-hivatkozás) részben olvashatsz.

## Ablak előnézetek

Minden nyitott alkalmazás saját gombbal jelenik meg a tálcán, még akkor is, ha ugyanabból az alkalmazásból több példány fut.

### Előnézeti kép funkció

Ha engedélyezve van a Beállítások alkalmazásban (Teljesítmény szakasz), az inaktív ablakok előnézeti képpel rendelkeznek:

1. Vidd az egeret egy alkalmazás gombjára a tálcán
2. Megjelenik az ablak előnézeti képe
3. Kattints a gombra az ablak előtérbe hozásához

**Fontos:** Az előnézeti képek erőforrás-igényesek és lassíthatják az alkalmazások minimalizálási idejét. Ha gyorsabb működést szeretnél, kapcsold ki ezt a funkciót a Beállítások > Teljesítmény menüpontban.

![Placeholder: Ablak előnézet megjelenítése a tálca felett](../../../../../assets/desktop/preview.webp)
_Ablak előnézeti kép megjelenítése a tálcán_

## Kapcsolódó témák

- [Tálca](./taskbar/) - Alkalmazás gombok és rendszer funkciók
- [Alkalmazások](../applications/) - Alkalmazások használata
- [Beállítások](../applications/settings/) - Ablak előnézetek beállítása
