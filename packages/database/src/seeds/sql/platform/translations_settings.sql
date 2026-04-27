-- =============================================================================
-- SETTINGS NAMESPACE - Beállítások alkalmazás fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a Settings app összes szövegét.
-- Szekciók: menu, appearance, background, taskbar, performance, language, about
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Settings app menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'menu.account', 'Fiók'),
('hu', 'settings', 'menu.security', 'Biztonság'),
('hu', 'settings', 'menu.appearance', 'Megjelenés'),
('hu', 'settings', 'menu.desktop', 'Asztal'),
('hu', 'settings', 'menu.general', 'Általános'),
('hu', 'settings', 'menu.background', 'Háttér'),
('hu', 'settings', 'menu.taskbar', 'Tálca'),
('hu', 'settings', 'menu.startPanel', 'Indító panel'),
('hu', 'settings', 'menu.performance', 'Teljesítmény'),
('hu', 'settings', 'menu.language', 'Nyelv és régió'),
('hu', 'settings', 'menu.aiAssistant', 'AI asszisztens'),
('hu', 'settings', 'menu.aiAgent', 'AI ügynök'),
('hu', 'settings', 'menu.ttsProvider', 'TTS szolgáltató'),
('hu', 'settings', 'menu.aiAvatar', 'AI Avatar telepítés'),
('hu', 'settings', 'menu.knowledgeBase', 'Tudásbázis'),
('hu', 'settings', 'menu.about', 'Névjegy')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Placeholder beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'placeholder.title', 'Fejlesztés alatt'),
('hu', 'settings', 'placeholder.message', 'Ez a funkció hamarosan elérhető lesz.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Indító panel beállítások (StartMenuSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'startmenu.title', 'Indító panel beállítások'),
('hu', 'settings', 'startmenu.viewMode.label', 'Alkalmazás lista megjelenítése'),
('hu', 'settings', 'startmenu.viewMode.description', 'Válassza ki, hogyan jelenjenek meg az alkalmazások'),
('hu', 'settings', 'startmenu.viewMode.info', 'Az ikon nézet rácsos elrendezésben jeleníti meg az alkalmazásokat ikonjaikkal, míg a lista nézet részletesebb információkat mutat soronként. Válassza ki a preferált megjelenítési módot.'),
('hu', 'settings', 'startmenu.viewMode.grid', 'Ikon nézet'),
('hu', 'settings', 'startmenu.viewMode.list', 'Lista nézet'),
('hu', 'settings', 'startmenu.viewMode.saved', 'Nézet mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános beállítások (GeneralSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'general.title', 'Általános beállítások'),
('hu', 'settings', 'general.languageRegion.title', 'Nyelv és régió'),
('hu', 'settings', 'general.languageRegion.description', 'Nyelvi és regionális beállítások kezelése'),
('hu', 'settings', 'general.notifications.title', 'Értesítések'),
('hu', 'settings', 'general.notifications.description', 'Értesítési beállítások kezelése'),
('hu', 'settings', 'general.privacy.title', 'Adatvédelem'),
('hu', 'settings', 'general.privacy.description', 'Adatvédelmi beállítások kezelése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Nyelv beállítások (LanguageSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'language.title', 'Nyelv beállítások'),
('hu', 'settings', 'language.select.label', 'Nyelv kiválasztása'),
('hu', 'settings', 'language.select.description', 'Válassza ki a felület nyelvét'),
('hu', 'settings', 'language.info', 'A nyelv beállítása hatással van az egész rendszer szövegeire. A változtatás azonnal érvénybe lép.'),
('hu', 'settings', 'language.current', 'Jelenlegi nyelv'),
('hu', 'settings', 'language.saved', 'Nyelv beállítva'),
('hu', 'settings', 'language.error', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés beállítások (AppearanceSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.title', 'Megjelenés beállítások'),
('hu', 'settings', 'appearance.desktopTheme.label', 'Desktop téma mód'),
('hu', 'settings', 'appearance.desktopTheme.description', 'Válassza ki a desktop megjelenését'),
('hu', 'settings', 'appearance.desktopTheme.info', 'A desktop téma mód határozza meg az alkalmazás általános megjelenését. A világos mód világos hátteret és sötét szöveget használ, míg a sötét mód sötét hátteret és világos szöveget. Az automatikus mód a rendszer beállításait követi.'),
('hu', 'settings', 'appearance.taskbarTheme.label', 'Taskbar téma mód'),
('hu', 'settings', 'appearance.taskbarTheme.description', 'A taskbar eltérő témát használhat a desktoptól'),
('hu', 'settings', 'appearance.taskbarTheme.info', 'Ez hasznos lehet, ha szeretnéd, hogy a taskbar jobban kiemelkedjen vagy kevésbé legyen feltűnő.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Megjelenés - téma módok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.themeMode.light', 'Világos mód'),
('hu', 'settings', 'appearance.themeMode.dark', 'Sötét mód'),
('hu', 'settings', 'appearance.themeMode.auto', 'Automatikus mód'),
('hu', 'settings', 'appearance.themeMode.saved', 'Téma mód mentve'),
('hu', 'settings', 'appearance.taskbarMode.saved', 'Taskbar mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - színek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.colors.label', 'Színek'),
('hu', 'settings', 'appearance.colors.description', 'Válassza ki az alkalmazás elsődleges színét'),
('hu', 'settings', 'appearance.colors.info', 'Az elsődleges szín határozza meg az alkalmazás kiemelő színét, amely megjelenik a gombokban, linkekben és más interaktív elemekben. Válasszon egy előre definiált színt, vagy hozzon létre egyedi színt az árnyalat csúszkával.'),
('hu', 'settings', 'appearance.colors.saved', 'Szín mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - betűméret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.fontSize.label', 'Betűméret'),
('hu', 'settings', 'appearance.fontSize.description', 'A rendszer betűméretének beállítása'),
('hu', 'settings', 'appearance.fontSize.info', 'A betűméret beállítása hatással van az egész rendszer szövegeinek méretére. Nagyobb betűméret könnyebb olvashatóságot biztosít, míg kisebb betűméret több információt jelenít meg a képernyőn.'),
('hu', 'settings', 'appearance.fontSize.small', 'Kicsi'),
('hu', 'settings', 'appearance.fontSize.medium', 'Közepes'),
('hu', 'settings', 'appearance.fontSize.large', 'Nagy'),
('hu', 'settings', 'appearance.fontSize.saved', 'Betűméret mentve'),
-- Megjelenés - témák
('hu', 'settings', 'appearance.presets.label', 'Témák'),
('hu', 'settings', 'appearance.presets.description', 'Válasszon egy előre definiált témát vagy testreszabott beállításokat'),
('hu', 'settings', 'appearance.presets.info', 'A témák előre definiált beállítások kombinációi, amelyek egy kattintásra alkalmazhatók. Ezek tartalmazzák a téma módot, a szín- és betűméret valamint a háttér beállításokat. Bármikor visszatérhetsz a testreszabott beállításokhoz.'),
('hu', 'settings', 'appearance.presets.applied', 'A(z) {name} téma alkalmazva'),
('hu', 'settings', 'appearance.presets.loadFailed', 'Nem sikerült betölteni a témákat'),
-- Megjelenés - téma jelölők tooltip-jei
('hu', 'settings', 'appearance.preset.mode', 'Téma mód'),
('hu', 'settings', 'appearance.preset.color', 'Elsődleges szín'),
('hu', 'settings', 'appearance.preset.background', 'Háttér típusa')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér beállítások (BackgroundSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.title', 'Háttér beállítások'),
('hu', 'settings', 'background.type.label', 'Háttér típusa'),
('hu', 'settings', 'background.type.description', 'Válassza ki a desktop háttér típusát'),
('hu', 'settings', 'background.type.info', 'A háttér típusa határozza meg, hogy milyen módon jelenik meg a desktop háttere. A szín opció egy egyszínű hátteret biztosít, a kép egy statikus háttérképet, míg a videó egy animált hátteret.'),
('hu', 'settings', 'background.type.color', 'Szín'),
('hu', 'settings', 'background.type.image', 'Kép'),
('hu', 'settings', 'background.type.video', 'Videó'),
('hu', 'settings', 'background.type.saved', 'Háttér típus mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - szín
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.color.label', 'Háttérszín'),
('hu', 'settings', 'background.color.description', 'Válasszon egy színt a desktop hátteréhez'),
('hu', 'settings', 'background.color.info', 'Válasszon egy előre definiált színt, vagy hozzon létre egyedi színt a színválasztóval. A kiválasztott szín azonnal alkalmazásra kerül a desktop hátterén.'),
('hu', 'settings', 'background.color.saved', 'Háttérszín mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - kép
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.image.label', 'Háttérkép'),
('hu', 'settings', 'background.image.description', 'Válasszon egy képet a desktop hátteréhez'),
('hu', 'settings', 'background.image.info', 'Válasszon egy előre definiált háttérképet a listából. A kép a teljes desktop területén megjelenik, és automatikusan igazodik a képernyő méretéhez.'),
('hu', 'settings', 'background.image.saved', 'Háttérkép mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér - videó
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.video.label', 'Háttérvideó'),
('hu', 'settings', 'background.video.description', 'Válasszon egy videót a desktop hátteréhez'),
('hu', 'settings', 'background.video.info', 'Válasszon egy előre definiált háttérvideót a listából. A videó folyamatosan ismétlődik a háttérben, és automatikusan igazodik a képernyő méretéhez. A videó némítva van, és nem befolyásolja a rendszer teljesítményét jelentősen.'),
('hu', 'settings', 'background.video.saved', 'Háttérvideó mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca beállítások (TaskbarSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.title', 'Tálca beállítások'),
('hu', 'settings', 'taskbar.position.label', 'Tálca pozíció'),
('hu', 'settings', 'taskbar.position.description', 'A tálca helye a képernyőn'),
('hu', 'settings', 'taskbar.position.info', 'Válassza ki, hol legyen a tálca - felül vagy alul. A megfelelő elhelyezés kényelmesebb navigációt és jobb átláthatóságot biztosít.'),
('hu', 'settings', 'taskbar.position.top', 'Felül'),
('hu', 'settings', 'taskbar.position.bottom', 'Alul'),
('hu', 'settings', 'taskbar.position.saved', 'Tálca pozíció mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca - stílus
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.style.label', 'Tálca kinézete'),
('hu', 'settings', 'taskbar.style.description', 'Klasszikus vagy lebegő dizájn'),
('hu', 'settings', 'taskbar.style.info', 'A klasszikus tálca végigfut a képernyőn, míg a lebegő dizájn szellősebb megjelenést ad margókkal és lekerekített sarkokkal. A választás nem befolyásolja a működést, csak a megjelenést.'),
('hu', 'settings', 'taskbar.style.classic', 'Klasszikus'),
('hu', 'settings', 'taskbar.style.modern', 'Lebegő'),
('hu', 'settings', 'taskbar.style.saved', 'Tálca stílus mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Tálca - elemek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.items.label', 'Tálca elemei'),
('hu', 'settings', 'taskbar.items.description', 'A tálcán megjelenő elemek kezelése'),
('hu', 'settings', 'taskbar.items.info', 'Kapcsolja ki azokat az elemeket, amelyeket nem szeretne látni a tálcán. Az elemek elrejtése tisztább megjelenést biztosít és több helyet hagy a futó alkalmazásoknak.'),
('hu', 'settings', 'taskbar.items.clock.label', 'Óra'),
('hu', 'settings', 'taskbar.items.clock.description', 'Aktuális idő megjelenítése'),
('hu', 'settings', 'taskbar.items.themeSwitcher.label', 'Témaváltó'),
('hu', 'settings', 'taskbar.items.themeSwitcher.description', 'Világos/sötét téma kapcsoló'),
('hu', 'settings', 'taskbar.items.appGuidLink.label', 'Alkalmazás megnyitó'),
('hu', 'settings', 'taskbar.items.appGuidLink.description', 'Alkalmazás megnyitása guid hivatkozás alapján'),
('hu', 'settings', 'taskbar.items.messages.label', 'Üzenetek'),
('hu', 'settings', 'taskbar.items.messages.description', 'Chat üzenetek gyors elérése'),
('hu', 'settings', 'taskbar.items.notifications.label', 'Értesítések'),
('hu', 'settings', 'taskbar.items.notifications.description', 'Rendszer értesítések megjelenítése'),
('hu', 'settings', 'taskbar.items.saved', 'Tálca elem beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény beállítások (PerformanceSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.title', 'Teljesítmény beállítások'),
('hu', 'settings', 'performance.optimization.label', 'Teljesítmény optimalizálás'),
('hu', 'settings', 'performance.optimization.description', 'Gyorsabb működés a vizuális effektek rovására'),
('hu', 'settings', 'performance.optimization.info', 'Ha be van kapcsolva, az ablakok mozgatása közben a tartalmuk el van rejtve, és az ablak előnézet funkció is le van tiltva. Ez jelentősen javítja a teljesítményt lassabb eszközökön.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Teljesítmény - ablak előnézet
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.windowPreview.label', 'Ablak előnézet'),
('hu', 'settings', 'performance.windowPreview.description', 'Előnézeti képek megjelenítése a tálcán'),
('hu', 'settings', 'performance.windowPreview.info', 'Az ablak előnézet funkció lehetővé teszi, hogy a tálcán lévő alkalmazások ikonjára mutatva egy kis előnézeti képet láss az ablak tartalmáról. Ez megkönnyíti a nyitott ablakok közötti navigációt.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény - előnézeti kép méret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.previewSize.label', 'Előnézeti kép'),
('hu', 'settings', 'performance.previewSize.description', 'Az előnézeti képek méretének kezelése'),
('hu', 'settings', 'performance.previewSize.info', 'Az előnézeti képek méretének beállítása. Nagyobb értékek részletesebb előnézeteket eredményeznek, de több memóriát és feldolgozási kapacitást igényelnek. Ajánlott érték: közepes.'),
('hu', 'settings', 'performance.previewSize.small', 'kicsi'),
('hu', 'settings', 'performance.previewSize.medium', 'közepes'),
('hu', 'settings', 'performance.previewSize.large', 'nagy'),
('hu', 'settings', 'performance.previewSize.huge', 'hatalmas'),
('hu', 'settings', 'performance.saved', 'Beállítások mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Rendszer információk (About.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'about.title', 'Rendszer információk'),
('hu', 'settings', 'about.version', 'Verzió'),
('hu', 'settings', 'about.description', 'Modern webes asztali környezet a hatékony munkavégzéshez.'),
('hu', 'settings', 'about.changelog', 'Verzió előzmények'),
('hu', 'settings', 'about.copyright', '© {year} Racona')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Profil beállítások (ProfileSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'profile.title', 'Profil beállítások'),
('hu', 'settings', 'profile.avatar.title', 'Profilkép'),
('hu', 'settings', 'profile.avatar.description', 'Töltse fel a profilképét vagy használja az alapértelmezettet'),
('hu', 'settings', 'profile.avatar.upload', 'Kép feltöltése'),
('hu', 'settings', 'profile.avatar.reset', 'Visszaállítás alapértelmezettre'),
('hu', 'settings', 'profile.avatar.syncedFrom', 'Szinkronizálva: {provider}'),
('hu', 'settings', 'profile.info.title', 'Profil információk'),
('hu', 'settings', 'profile.info.description', 'Kezelje a személyes adatait'),
('hu', 'settings', 'profile.name.label', 'Teljes név'),
('hu', 'settings', 'profile.name.placeholder', 'Adja meg a nevét'),
('hu', 'settings', 'profile.name.error.required', 'A név megadása kötelező'),
('hu', 'settings', 'profile.username.label', 'Felhasználónév'),
('hu', 'settings', 'profile.username.placeholder', 'Adja meg a felhasználónevét'),
('hu', 'settings', 'profile.username.error.format', 'Csak betűk, számok és aláhúzás megengedett'),
('hu', 'settings', 'profile.username.error.minLength', 'Minimum 3 karakter szükséges'),
('hu', 'settings', 'profile.username.error.maxLength', 'Maximum 50 karakter megengedett'),
('hu', 'settings', 'profile.username.error.taken', 'Ez a felhasználónév már foglalt'),
('hu', 'settings', 'profile.email.label', 'E-mail cím'),
('hu', 'settings', 'profile.accountType.label', 'Fiók típusa'),
('hu', 'settings', 'profile.accountType.google', 'Google fiók'),
('hu', 'settings', 'profile.accountType.email', 'E-mail fiók'),
('hu', 'settings', 'profile.groups.label', 'Csoportok'),
('hu', 'settings', 'profile.roles.label', 'Szerepkörök'),
('hu', 'settings', 'profile.createdAt.label', 'Regisztráció dátuma'),
('hu', 'settings', 'profile.save', 'Mentés'),
('hu', 'settings', 'profile.saving', 'Mentés...'),
('hu', 'settings', 'profile.saved', 'Profil sikeresen mentve'),
('hu', 'settings', 'profile.error', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- AI Agent beállítások (AIAgentConfigPanel.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'admin.aiAgent.title', 'AI ügynök beállítások'),
('hu', 'settings', 'admin.aiAgent.enableTitle', 'AI ügynök engedélyezése'),
('hu', 'settings', 'admin.aiAgent.enableDescription', 'AI ügynök funkciók globális engedélyezése vagy letiltása'),
('hu', 'settings', 'admin.aiAgent.enableInfo', 'Ha ki van kapcsolva, az AI ügynök funkciók nem lesznek elérhetők a rendszerben. Ez magában foglalja az AI asszisztenst, a TTS szolgáltatásokat és minden kapcsolódó funkciót.'),
('hu', 'settings', 'admin.aiAgent.description', 'AI asszisztens szolgáltató és modell konfigurációja'),
('hu', 'settings', 'admin.aiAgent.info', 'Konfigurálja az AI asszisztens szolgáltatót és modellt a chat funkciók használatához. A beállítások mentése után tesztelheti a kapcsolatot.'),
('hu', 'settings', 'admin.aiAgent.active', 'Aktív konfiguráció'),
('hu', 'settings', 'admin.aiAgent.inactive', 'Nincs konfiguráció'),
('hu', 'settings', 'admin.aiAgent.provider', 'Szolgáltató'),
('hu', 'settings', 'admin.aiAgent.model', 'Modell'),
('hu', 'settings', 'admin.aiAgent.modelPlaceholder', 'pl. gpt-4, claude-3-sonnet'),
('hu', 'settings', 'admin.aiAgent.apiKey', 'API kulcs'),
('hu', 'settings', 'admin.aiAgent.apiKeyPlaceholder', 'Adja meg az API kulcsot'),
('hu', 'settings', 'admin.aiAgent.baseUrl', 'Alap URL (opcionális)'),
('hu', 'settings', 'admin.aiAgent.baseUrlPlaceholder', 'Egyedi API végpont URL'),
('hu', 'settings', 'admin.aiAgent.testConnection', 'Kapcsolat tesztelése'),
('hu', 'settings', 'admin.aiAgent.testSuccess', 'Kapcsolat sikeres'),
('hu', 'settings', 'admin.aiAgent.testFailed', 'Kapcsolat sikertelen'),
('hu', 'settings', 'admin.aiAgent.saveSuccess', 'Beállítások mentve'),
('hu', 'settings', 'admin.aiAgent.saveFailed', 'Mentés sikertelen'),
('hu', 'settings', 'admin.aiAgent.disabled', 'AI ügynök kikapcsolva'),
('hu', 'settings', 'admin.aiAgent.loadFailed', 'Betöltés sikertelen'),
('hu', 'settings', 'admin.aiAgent.advancedParams', 'Speciális paraméterek'),
('hu', 'settings', 'admin.aiAgent.advancedParamsDescription', 'AI modell viselkedésének finomhangolása'),
('hu', 'settings', 'admin.aiAgent.advancedParamsInfo', 'Ezek a paraméterek befolyásolják az AI válaszok minőségét és stílusát. Csak akkor módosítsa őket, ha ismeri a hatásukat.'),
('hu', 'settings', 'admin.aiAgent.maxTokens', 'Max tokenek'),
('hu', 'settings', 'admin.aiAgent.maxTokensTooltip', 'A válasz maximális hossza tokenekben. Magasabb érték hosszabb válaszokat tesz lehetővé, de több költséggel jár.'),
('hu', 'settings', 'admin.aiAgent.temperature', 'Kreativitás'),
('hu', 'settings', 'admin.aiAgent.temperatureTooltip', 'Szabályozza a válaszok kreativitását. 0.0 = determinisztikus, 2.0 = nagyon kreatív. Ajánlott: 0.7'),
('hu', 'settings', 'admin.aiAgent.topP', 'Top P'),
('hu', 'settings', 'admin.aiAgent.topPTooltip', 'Nucleus sampling paraméter. Alacsonyabb értékek fókuszáltabb, magasabb értékek változatosabb válaszokat eredményeznek.'),
('hu', 'settings', 'admin.aiAgent.validation.required', 'API kulcs és modell megadása kötelező'),
('hu', 'settings', 'admin.aiAgent.validation.maxTokensRange', 'Max tokenek értéke 1 és 100,000 között kell legyen'),
('hu', 'settings', 'admin.aiAgent.validation.temperatureRange', 'Kreativitás értéke 0.0 és 2.0 között kell legyen'),
('hu', 'settings', 'admin.aiAgent.validation.topPRange', 'Top P értéke 0.0 és 1.0 között kell legyen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Settings app menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'menu.account', 'Account'),
('en', 'settings', 'menu.security', 'Security'),
('en', 'settings', 'menu.appearance', 'Appearance'),
('en', 'settings', 'menu.desktop', 'Desktop'),
('en', 'settings', 'menu.general', 'General'),
('en', 'settings', 'menu.background', 'Background'),
('en', 'settings', 'menu.taskbar', 'Taskbar'),
('en', 'settings', 'menu.startPanel', 'Start Panel'),
('en', 'settings', 'menu.performance', 'Performance'),
('en', 'settings', 'menu.language', 'Language & Region'),
('en', 'settings', 'menu.aiAssistant', 'AI assistant'),
('en', 'settings', 'menu.aiAgent', 'AI Agent'),
('en', 'settings', 'menu.ttsProvider', 'TTS Provider'),
('en', 'settings', 'menu.aiAvatar', 'Avatar Installation'),
('en', 'settings', 'menu.knowledgeBase', 'Knowledge Base'),
('en', 'settings', 'menu.about', 'About')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Placeholder beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'placeholder.title', 'Under Development'),
('en', 'settings', 'placeholder.message', 'This feature will be available soon.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Indító panel beállítások (StartMenuSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'startmenu.title', 'Start Menu Settings'),
('en', 'settings', 'startmenu.viewMode.label', 'Application List Display'),
('en', 'settings', 'startmenu.viewMode.description', 'Choose how applications are displayed'),
('en', 'settings', 'startmenu.viewMode.info', 'Grid view displays applications in a grid layout with their icons, while list view shows more detailed information in rows. Choose your preferred display mode.'),
('en', 'settings', 'startmenu.viewMode.grid', 'Grid View'),
('en', 'settings', 'startmenu.viewMode.list', 'List View'),
('en', 'settings', 'startmenu.viewMode.saved', 'View mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'general.title', 'General Settings'),
('en', 'settings', 'general.languageRegion.title', 'Language & Region'),
('en', 'settings', 'general.languageRegion.description', 'Manage language and regional settings'),
('en', 'settings', 'general.notifications.title', 'Notifications'),
('en', 'settings', 'general.notifications.description', 'Manage notification settings'),
('en', 'settings', 'general.privacy.title', 'Privacy'),
('en', 'settings', 'general.privacy.description', 'Manage privacy settings')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Nyelv beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'language.title', 'Language Settings'),
('en', 'settings', 'language.select.label', 'Select Language'),
('en', 'settings', 'language.select.description', 'Choose the interface language'),
('en', 'settings', 'language.info', 'The language setting affects all system texts. Changes take effect immediately.'),
('en', 'settings', 'language.current', 'Current language'),
('en', 'settings', 'language.saved', 'Language saved'),
('en', 'settings', 'language.error', 'An error occurred while saving')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.title', 'Appearance Settings'),
('en', 'settings', 'appearance.desktopTheme.label', 'Desktop Theme Mode'),
('en', 'settings', 'appearance.desktopTheme.description', 'Choose the desktop appearance'),
('en', 'settings', 'appearance.desktopTheme.info', 'The desktop theme mode determines the overall appearance of the application. Light mode uses a light background with dark text, while dark mode uses a dark background with light text. Auto mode follows system settings.'),
('en', 'settings', 'appearance.taskbarTheme.label', 'Taskbar Theme Mode'),
('en', 'settings', 'appearance.taskbarTheme.description', 'The taskbar can use a different theme from the desktop'),
('en', 'settings', 'appearance.taskbarTheme.info', 'This can be useful if you want the taskbar to stand out more or be less prominent.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - téma módok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.themeMode.light', 'Light Mode'),
('en', 'settings', 'appearance.themeMode.dark', 'Dark Mode'),
('en', 'settings', 'appearance.themeMode.auto', 'Auto Mode'),
('en', 'settings', 'appearance.themeMode.saved', 'Theme mode saved'),
('en', 'settings', 'appearance.taskbarMode.saved', 'Taskbar mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Megjelenés - színek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.colors.label', 'Colors'),
('en', 'settings', 'appearance.colors.description', 'Choose the primary color of the application'),
('en', 'settings', 'appearance.colors.info', 'The primary color determines the accent color of the application, which appears in buttons, links, and other interactive elements. Choose a predefined color or create a custom color with the hue slider.'),
('en', 'settings', 'appearance.colors.saved', 'Color saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - betűméret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.fontSize.label', 'Font Size'),
('en', 'settings', 'appearance.fontSize.description', 'Set the system font size'),
('en', 'settings', 'appearance.fontSize.info', 'The font size setting affects all system text sizes. Larger font sizes provide easier readability, while smaller font sizes display more information on screen.'),
('en', 'settings', 'appearance.fontSize.small', 'Small'),
('en', 'settings', 'appearance.fontSize.medium', 'Medium'),
('en', 'settings', 'appearance.fontSize.large', 'Large'),
('en', 'settings', 'appearance.fontSize.saved', 'Font size saved'),
-- Megjelenés - témák
('en', 'settings', 'appearance.presets.label', 'Themes'),
('en', 'settings', 'appearance.presets.description', 'Choose a predefined theme or custom settings'),
('en', 'settings', 'appearance.presets.info', 'Themes are predefined combinations of settings that can be applied with one click. They include theme mode, color, font size and wallpaper settings. You can always return to custom settings.'),
('en', 'settings', 'appearance.presets.applied', 'Theme {name} applied'),
('en', 'settings', 'appearance.presets.loadFailed', 'Failed to load themes'),
-- Megjelenés - téma jelölők tooltip-jei
('en', 'settings', 'appearance.preset.mode', 'Theme mode'),
('en', 'settings', 'appearance.preset.color', 'Primary color'),
('en', 'settings', 'appearance.preset.background', 'Background type')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.title', 'Background Settings'),
('en', 'settings', 'background.type.label', 'Background Type'),
('en', 'settings', 'background.type.description', 'Choose the desktop background type'),
('en', 'settings', 'background.type.info', 'The background type determines how the desktop background appears. The color option provides a solid color background, image provides a static wallpaper, while video provides an animated background.'),
('en', 'settings', 'background.type.color', 'Color'),
('en', 'settings', 'background.type.image', 'Image'),
('en', 'settings', 'background.type.video', 'Video'),
('en', 'settings', 'background.type.saved', 'Background type saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér - szín, kép, videó
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.color.label', 'Background Color'),
('en', 'settings', 'background.color.description', 'Choose a color for the desktop background'),
('en', 'settings', 'background.color.info', 'Choose a predefined color or create a custom color with the color picker. The selected color is immediately applied to the desktop background.'),
('en', 'settings', 'background.color.saved', 'Background color saved'),
('en', 'settings', 'background.image.label', 'Background Image'),
('en', 'settings', 'background.image.description', 'Choose an image for the desktop background'),
('en', 'settings', 'background.image.info', 'Choose a predefined wallpaper from the list. The image covers the entire desktop area and automatically adjusts to the screen size.'),
('en', 'settings', 'background.image.saved', 'Background image saved'),
('en', 'settings', 'background.video.label', 'Background Video'),
('en', 'settings', 'background.video.description', 'Choose a video for the desktop background'),
('en', 'settings', 'background.video.info', 'Choose a predefined background video from the list. The video loops continuously in the background and automatically adjusts to the screen size. The video is muted and does not significantly affect system performance.'),
('en', 'settings', 'background.video.saved', 'Background video saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'taskbar.title', 'Taskbar Settings'),
('en', 'settings', 'taskbar.position.label', 'Taskbar Position'),
('en', 'settings', 'taskbar.position.description', 'The taskbar location on screen'),
('en', 'settings', 'taskbar.position.info', 'Choose where the taskbar should be - top or bottom. The right placement provides more comfortable navigation and better visibility.'),
('en', 'settings', 'taskbar.position.top', 'Top'),
('en', 'settings', 'taskbar.position.bottom', 'Bottom'),
('en', 'settings', 'taskbar.position.saved', 'Taskbar position saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Tálca - stílus és elemek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'taskbar.style.label', 'Taskbar Style'),
('en', 'settings', 'taskbar.style.description', 'Classic or floating design'),
('en', 'settings', 'taskbar.style.info', 'The classic taskbar spans the entire screen, while the floating design provides a more airy appearance with margins and rounded corners. The choice does not affect functionality, only appearance.'),
('en', 'settings', 'taskbar.style.classic', 'Classic'),
('en', 'settings', 'taskbar.style.modern', 'Floating'),
('en', 'settings', 'taskbar.style.saved', 'Taskbar style saved'),
('en', 'settings', 'taskbar.items.label', 'Taskbar Items'),
('en', 'settings', 'taskbar.items.description', 'Manage items displayed on the taskbar'),
('en', 'settings', 'taskbar.items.info', 'Turn off items you do not want to see on the taskbar. Hiding items provides a cleaner appearance and leaves more space for running applications.'),
('en', 'settings', 'taskbar.items.clock.label', 'Clock'),
('en', 'settings', 'taskbar.items.clock.description', 'Display current time'),
('en', 'settings', 'taskbar.items.themeSwitcher.label', 'Theme Switcher'),
('en', 'settings', 'taskbar.items.themeSwitcher.description', 'Light/dark theme toggle'),
('en', 'settings', 'taskbar.items.appGuidLink.label', 'App Launcher'),
('en', 'settings', 'taskbar.items.appGuidLink.description', 'Open application via guid link'),
('en', 'settings', 'taskbar.items.messages.label', 'Messages'),
('en', 'settings', 'taskbar.items.messages.description', 'Quick access to chat messages'),
('en', 'settings', 'taskbar.items.notifications.label', 'Notifications'),
('en', 'settings', 'taskbar.items.notifications.description', 'Display system notifications'),
('en', 'settings', 'taskbar.items.saved', 'Taskbar item setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'performance.title', 'Performance Settings'),
('en', 'settings', 'performance.optimization.label', 'Performance Optimization'),
('en', 'settings', 'performance.optimization.description', 'Faster operation at the expense of visual effects'),
('en', 'settings', 'performance.optimization.info', 'When enabled, window content is hidden during dragging, and the window preview feature is also disabled. This significantly improves performance on slower devices.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Teljesítmény - ablak előnézet és méret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'performance.windowPreview.label', 'Window Preview'),
('en', 'settings', 'performance.windowPreview.description', 'Show preview images on the taskbar'),
('en', 'settings', 'performance.windowPreview.info', 'The window preview feature allows you to see a small preview image of the window content when hovering over application icons on the taskbar. This makes navigation between open windows easier.'),
('en', 'settings', 'performance.previewSize.label', 'Preview Image'),
('en', 'settings', 'performance.previewSize.description', 'Manage preview image size'),
('en', 'settings', 'performance.previewSize.info', 'Set the preview image size. Larger values result in more detailed previews but require more memory and processing power. Recommended value: medium.'),
('en', 'settings', 'performance.previewSize.small', 'small'),
('en', 'settings', 'performance.previewSize.medium', 'medium'),
('en', 'settings', 'performance.previewSize.large', 'large'),
('en', 'settings', 'performance.previewSize.huge', 'huge'),
('en', 'settings', 'performance.saved', 'Settings saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Rendszer információk
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'about.title', 'System Information'),
('en', 'settings', 'about.version', 'Version'),
('en', 'settings', 'about.description', 'Modern web desktop environment for efficient work.'),
('en', 'settings', 'about.changelog', 'Version History'),
('en', 'settings', 'about.copyright', '© {year} Racona')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Profil beállítások (ProfileSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'profile.title', 'Profile Settings'),
('en', 'settings', 'profile.avatar.title', 'Profile Picture'),
('en', 'settings', 'profile.avatar.description', 'Upload your profile picture or use the default'),
('en', 'settings', 'profile.avatar.upload', 'Upload Image'),
('en', 'settings', 'profile.avatar.reset', 'Reset to Default'),
('en', 'settings', 'profile.avatar.syncedFrom', 'Synced from: {provider}'),
('en', 'settings', 'profile.info.title', 'Profile Information'),
('en', 'settings', 'profile.info.description', 'Manage your personal information'),
('en', 'settings', 'profile.name.label', 'Full Name'),
('en', 'settings', 'profile.name.placeholder', 'Enter your name'),
('en', 'settings', 'profile.name.error.required', 'Name is required'),
('en', 'settings', 'profile.username.label', 'Username'),
('en', 'settings', 'profile.username.placeholder', 'Enter your username'),
('en', 'settings', 'profile.username.error.format', 'Only letters, numbers and underscores allowed'),
('en', 'settings', 'profile.username.error.minLength', 'Minimum 3 characters required'),
('en', 'settings', 'profile.username.error.maxLength', 'Maximum 50 characters allowed'),
('en', 'settings', 'profile.username.error.taken', 'This username is already taken'),
('en', 'settings', 'profile.email.label', 'Email Address'),
('en', 'settings', 'profile.accountType.label', 'Account Type'),
('en', 'settings', 'profile.accountType.google', 'Google Account'),
('en', 'settings', 'profile.accountType.email', 'Email Account'),
('en', 'settings', 'profile.groups.label', 'Groups'),
('en', 'settings', 'profile.roles.label', 'Roles'),
('en', 'settings', 'profile.createdAt.label', 'Registration Date'),
('en', 'settings', 'profile.save', 'Save'),
('en', 'settings', 'profile.saving', 'Saving...'),
('en', 'settings', 'profile.saved', 'Profile saved successfully'),
('en', 'settings', 'profile.error', 'An error occurred while saving')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Biztonság beállítások (SecuritySettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.title', 'Biztonság'),
('hu', 'settings', 'security.2fa.title', 'Kétfaktoros hitelesítés (2FA)'),
('hu', 'settings', 'security.2fa.description', 'Extra biztonsági réteg hozzáadása fiókjához egy második ellenőrző lépéssel.'),
('hu', 'settings', 'security.2fa.info', 'A kétfaktoros hitelesítés jelentősen megnehezíti a jogosulatlan hozzáférést fiókjához. Bejelentkezéskor jelszó mellett egy időalapú kódot is meg kell adnia az alkalmazásából.'),
('hu', 'settings', 'security.2fa.enabled', 'Engedélyezve'),
('hu', 'settings', 'security.2fa.disabled', 'Letiltva'),
('hu', 'settings', 'security.2fa.enable', 'Kétfaktoros hitelesítés engedélyezése'),
('hu', 'settings', 'security.2fa.disable', 'Kétfaktoros hitelesítés letiltása'),
('hu', 'settings', 'security.2fa.passwordLabel', 'Jelszó'),
('hu', 'settings', 'security.2fa.passwordPlaceholder', 'Adja meg a jelszavát'),
('hu', 'settings', 'security.2fa.setupStarted', '2FA beállítás elindítva'),
('hu', 'settings', 'security.2fa.scanQR', 'Szkennelje be a QR kódot hitelesítő alkalmazásával'),
('hu', 'settings', 'security.2fa.manualEntry', 'Vagy adja meg manuálisan'),
('hu', 'settings', 'security.2fa.verificationCode', 'Ellenőrző kód'),
('hu', 'settings', 'security.2fa.verify', 'Ellenőrzés'),
('hu', 'settings', 'security.2fa.regenerateBackupCodes', 'Tartalék kódok újragenerálása'),
('hu', 'settings', 'security.2fa.backupCodesTitle', 'Tartalék kódok'),
('hu', 'settings', 'security.2fa.backupCodesWarning', 'Mentse el ezeket a kódokat biztonságos helyre. Mindegyik csak egyszer használható.'),
('hu', 'settings', 'security.2fa.copyBackupCodes', 'Másolás'),
('hu', 'settings', 'security.2fa.downloadBackupCodes', 'Letöltés'),
('hu', 'settings', 'security.2fa.backupCodesGenerated', 'Tartalék kódok generálva'),
('hu', 'settings', 'security.2fa.backupCodesCopied', 'Tartalék kódok vágólapra másolva'),
('hu', 'settings', 'security.2fa.backupCodesDownloaded', 'Tartalék kódok letöltve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.title', 'Security'),
('en', 'settings', 'security.2fa.title', 'Two-Factor Authentication (2FA)'),
('en', 'settings', 'security.2fa.description', 'Add an extra layer of security to your account with a second verification step.'),
('en', 'settings', 'security.2fa.info', 'Two-factor authentication significantly increases the security of your account by requiring a time-based code from your authenticator app in addition to your password when logging in.'),
('en', 'settings', 'security.2fa.enabled', 'Enabled'),
('en', 'settings', 'security.2fa.disabled', 'Disabled'),
('en', 'settings', 'security.2fa.enable', 'Enable Two-Factor Authentication'),
('en', 'settings', 'security.2fa.disable', 'Disable Two-Factor Authentication'),
('en', 'settings', 'security.2fa.passwordLabel', 'Password'),
('en', 'settings', 'security.2fa.passwordPlaceholder', 'Enter your password'),
('en', 'settings', 'security.2fa.setupStarted', '2FA setup started'),
('en', 'settings', 'security.2fa.scanQR', 'Scan the QR code with your authenticator app'),
('en', 'settings', 'security.2fa.manualEntry', 'Or enter manually'),
('en', 'settings', 'security.2fa.verificationCode', 'Verification Code'),
('en', 'settings', 'security.2fa.verify', 'Verify'),
('en', 'settings', 'security.2fa.regenerateBackupCodes', 'Regenerate Backup Codes'),
('en', 'settings', 'security.2fa.backupCodesTitle', 'Backup Codes'),
('en', 'settings', 'security.2fa.backupCodesWarning', 'Save these codes in a secure place. Each can only be used once.'),
('en', 'settings', 'security.2fa.copyBackupCodes', 'Copy'),
('en', 'settings', 'security.2fa.downloadBackupCodes', 'Download'),
('en', 'settings', 'security.2fa.backupCodesGenerated', 'Backup codes generated'),
('en', 'settings', 'security.2fa.backupCodesCopied', 'Backup codes copied to clipboard'),
('en', 'settings', 'security.2fa.backupCodesDownloaded', 'Backup codes downloaded')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2FA hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.2fa.errors.passwordRequired', 'Jelszó megadása kötelező'),
('hu', 'settings', 'security.2fa.errors.codeRequired', 'Kód megadása kötelező'),
('hu', 'settings', 'security.2fa.errors.enableFailed', '2FA engedélyezése sikertelen'),
('hu', 'settings', 'security.2fa.errors.disableFailed', '2FA letiltása sikertelen'),
('hu', 'settings', 'security.2fa.errors.verifyFailed', 'Kód ellenőrzése sikertelen'),
('hu', 'settings', 'security.2fa.errors.backupCodesFailed', 'Tartalék kódok generálása sikertelen'),
('hu', 'settings', 'security.2fa.errors.incorrectPassword', 'Hibás jelszó')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.2fa.errors.passwordRequired', 'Password is required'),
('en', 'settings', 'security.2fa.errors.codeRequired', 'Code is required'),
('en', 'settings', 'security.2fa.errors.enableFailed', 'Failed to enable 2FA'),
('en', 'settings', 'security.2fa.errors.disableFailed', 'Failed to disable 2FA'),
('en', 'settings', 'security.2fa.errors.verifyFailed', 'Failed to verify code'),
('en', 'settings', 'security.2fa.errors.backupCodesFailed', 'Failed to generate backup codes'),
('en', 'settings', 'security.2fa.errors.incorrectPassword', 'Incorrect password')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó módosítás (SecuritySettings.svelte - Password Change)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.password.title', 'Jelszó módosítása'),
('hu', 'settings', 'security.password.description', 'Változtassa meg fiókja jelszavát a biztonság érdekében.'),
('hu', 'settings', 'security.password.info', 'Rendszeresen változtassa meg jelszavát fiókja biztonságának megőrzése érdekében. Használjon erős, egyedi jelszót, amelyet sehol máshol nem használ.'),
('hu', 'settings', 'security.password.currentPasswordLabel', 'Jelenlegi jelszó'),
('hu', 'settings', 'security.password.currentPasswordPlaceholder', 'Adja meg a jelenlegi jelszavát'),
('hu', 'settings', 'security.password.newPasswordLabel', 'Új jelszó'),
('hu', 'settings', 'security.password.newPasswordPlaceholder', 'Adja meg az új jelszavát'),
('hu', 'settings', 'security.password.confirmPasswordLabel', 'Új jelszó megerősítése'),
('hu', 'settings', 'security.password.confirmPasswordPlaceholder', 'Erősítse meg az új jelszavát'),
('hu', 'settings', 'security.password.passwordRequirements', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'settings', 'security.password.changeButton', 'Jelszó módosítása'),
('hu', 'settings', 'security.password.success', 'Jelszó sikeresen módosítva'),
('hu', 'settings', 'security.password.errors.currentPasswordRequired', 'Jelenlegi jelszó megadása kötelező'),
('hu', 'settings', 'security.password.errors.newPasswordRequired', 'Új jelszó megadása kötelező'),
('hu', 'settings', 'security.password.errors.passwordTooShort', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'settings', 'security.password.errors.passwordMismatch', 'A jelszavak nem egyeznek'),
('hu', 'settings', 'security.password.errors.samePassword', 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi'),
('hu', 'settings', 'security.password.errors.changeFailed', 'Jelszó módosítása sikertelen'),
('hu', 'settings', 'security.password.errors.incorrectPassword', 'Hibás jelenlegi jelszó')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.password.title', 'Change Password'),
('en', 'settings', 'security.password.description', 'Change your account password for security.'),
('en', 'settings', 'security.password.info', 'Regularly change your password to keep your account secure. Use a strong, unique password that you don''t use anywhere else.'),
('en', 'settings', 'security.password.currentPasswordLabel', 'Current Password'),
('en', 'settings', 'security.password.currentPasswordPlaceholder', 'Enter your current password'),
('en', 'settings', 'security.password.newPasswordLabel', 'New Password'),
('en', 'settings', 'security.password.newPasswordPlaceholder', 'Enter your new password'),
('en', 'settings', 'security.password.confirmPasswordLabel', 'Confirm New Password'),
('en', 'settings', 'security.password.confirmPasswordPlaceholder', 'Confirm your new password'),
('en', 'settings', 'security.password.passwordRequirements', 'Password must be at least 8 characters long'),
('en', 'settings', 'security.password.changeButton', 'Change Password'),
('en', 'settings', 'security.password.success', 'Password changed successfully'),
('en', 'settings', 'security.password.errors.currentPasswordRequired', 'Current password is required'),
('en', 'settings', 'security.password.errors.newPasswordRequired', 'New password is required'),
('en', 'settings', 'security.password.errors.passwordTooShort', 'Password must be at least 8 characters long'),
('en', 'settings', 'security.password.errors.passwordMismatch', 'Passwords do not match'),
('en', 'settings', 'security.password.errors.samePassword', 'New password cannot be the same as current password'),
('en', 'settings', 'security.password.errors.changeFailed', 'Failed to change password'),
('en', 'settings', 'security.password.errors.incorrectPassword', 'Incorrect current password')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Háttérkép feltöltés fordítások (BackgroundSettings.svelte - Upload)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.upload.label', 'Saját kép feltöltése'),
('hu', 'settings', 'background.upload.description', 'Töltsön fel saját háttérképet a számítógépéről'),
('hu', 'settings', 'background.upload.success', 'Háttérkép sikeresen feltöltve'),
('hu', 'settings', 'background.upload.error', 'Hiba történt a feltöltés során'),
('hu', 'settings', 'background.userImages.label', 'Saját képek'),
('hu', 'settings', 'background.userImages.description', 'Korábban feltöltött háttérképek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.upload.label', 'Upload Custom Image'),
('en', 'settings', 'background.upload.description', 'Upload your own wallpaper from your computer'),
('en', 'settings', 'background.upload.success', 'Wallpaper uploaded successfully'),
('en', 'settings', 'background.upload.error', 'An error occurred during upload'),
('en', 'settings', 'background.userImages.label', 'My Images'),
('en', 'settings', 'background.userImages.description', 'Previously uploaded wallpapers')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- Háttérkép törlés fordítások (BackgroundSettings.svelte - Delete)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.delete.button', 'Törlés'),
('hu', 'settings', 'background.delete.title', 'Háttérkép törlése'),
('hu', 'settings', 'background.delete.description', 'Biztosan törölni szeretné ezt a háttérképet? Ez a művelet nem vonható vissza.'),
('hu', 'settings', 'background.delete.confirm', 'Törlés'),
('hu', 'settings', 'background.delete.cancel', 'Mégse'),
('hu', 'settings', 'background.delete.success', 'Háttérkép sikeresen törölve'),
('hu', 'settings', 'background.delete.error', 'Hiba történt a törlés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.delete.button', 'Delete'),
('en', 'settings', 'background.delete.title', 'Delete Wallpaper'),
('en', 'settings', 'background.delete.description', 'Are you sure you want to delete this wallpaper? This action cannot be undone.'),
('en', 'settings', 'background.delete.confirm', 'Delete'),
('en', 'settings', 'background.delete.cancel', 'Cancel'),
('en', 'settings', 'background.delete.success', 'Wallpaper deleted successfully'),
('en', 'settings', 'background.delete.error', 'An error occurred while deleting')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - homályosítás (blur)
-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.blur.label', 'Homályosítás'),
('hu', 'settings', 'background.blur.description', 'Homályosító effekt mértékének beállítása a háttérképen'),
('hu', 'settings', 'background.blur.info', 'A homályosítás egy blur effektet alkalmaz a háttérképre, amely modernebb megjelenést kölcsönöz az asztalnak és javítja az ikonok, ablakok olvashatóságát. A csúszka segítségével állítsa be a kívánt mértéket.'),
('hu', 'settings', 'background.blur.toggle', 'Háttérkép homályosítása'),
('hu', 'settings', 'background.blur.saved', 'Homályosítás beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.blur.label', 'Blur'),
('en', 'settings', 'background.blur.description', 'Adjust the blur effect intensity on the background image'),
('en', 'settings', 'background.blur.info', 'Blur applies a blur effect to the wallpaper, giving the desktop a more modern look and improving the readability of icons and windows. Use the slider to set the desired intensity.'),
('en', 'settings', 'background.blur.toggle', 'Blur background image'),
('en', 'settings', 'background.blur.saved', 'Blur setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - szürkeárnyalatos (grayscale)
-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.grayscale.label', 'Fekete-fehér'),
('hu', 'settings', 'background.grayscale.description', 'Szürkeárnyalatos megjelenítés a háttérképen'),
('hu', 'settings', 'background.grayscale.info', 'A fekete-fehér mód szürkeárnyalatos filterrel jeleníti meg a háttérképet, amely elegáns, visszafogott megjelenést kölcsönöz az asztalnak. A homályosítás opcióval együtt is használható.'),
('hu', 'settings', 'background.grayscale.saved', 'Fekete-fehér beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.grayscale.label', 'Grayscale'),
('en', 'settings', 'background.grayscale.description', 'Display the background image in grayscale'),
('en', 'settings', 'background.grayscale.info', 'Grayscale mode applies a black and white filter to the wallpaper, giving the desktop an elegant, subdued appearance. Can be combined with the blur option.'),
('en', 'settings', 'background.grayscale.saved', 'Grayscale setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Asztal beállítások (DesktopSettings.svelte)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'desktop.title', 'Általános asztal beállítások'),
('hu', 'settings', 'desktop.clickMode.label', 'Parancsikonok megnyitása'),
('hu', 'settings', 'desktop.clickMode.description', 'Válassza ki, hogyan nyíljanak meg az asztali parancsikonok'),
('hu', 'settings', 'desktop.clickMode.info', 'Az egyszeres kattintás gyorsabb hozzáférést biztosít, míg a dupla kattintás megakadályozza a véletlen megnyitást. Válassza ki a preferált módot.'),
('hu', 'settings', 'desktop.clickMode.single', 'Egyszeres kattintás'),
('hu', 'settings', 'desktop.clickMode.double', 'Dupla kattintás'),
('hu', 'settings', 'desktop.clickMode.saved', 'Kattintási mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'desktop.title', 'General Desktop Settings'),
('en', 'settings', 'desktop.clickMode.label', 'Open Shortcuts'),
('en', 'settings', 'desktop.clickMode.description', 'Choose how desktop shortcuts should open'),
('en', 'settings', 'desktop.clickMode.info', 'Single click provides faster access, while double click prevents accidental opening. Choose your preferred mode.'),
('en', 'settings', 'desktop.clickMode.single', 'Single Click'),
('en', 'settings', 'desktop.clickMode.double', 'Double Click'),
('en', 'settings', 'desktop.clickMode.saved', 'Click mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- AI Agent Config Panel fordítások (AIAgentConfigPanel.svelte)
-- -----------------------------------------------------------------------------

-- Magyar fordítások (ezek már fent vannak az admin.aiAgent.* kulcsokkal)
-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'admin.aiAgent.title', 'AI Agent Settings'),
('en', 'settings', 'admin.aiAgent.enableTitle', 'Enable AI Agent'),
('en', 'settings', 'admin.aiAgent.enableDescription', 'Globally enable or disable AI agent features'),
('en', 'settings', 'admin.aiAgent.enableInfo', 'When disabled, AI agent features will not be available in the system. This includes the AI assistant, TTS services, and all related functionality.'),
('en', 'settings', 'admin.aiAgent.description', 'AI assistant provider and model configuration'),
('en', 'settings', 'admin.aiAgent.info', 'Configure the AI assistant provider and model for chat functionality. You can test the connection after saving the settings.'),
('en', 'settings', 'admin.aiAgent.active', 'Active Configuration'),
('en', 'settings', 'admin.aiAgent.inactive', 'No Configuration'),
('en', 'settings', 'admin.aiAgent.provider', 'Provider'),
('en', 'settings', 'admin.aiAgent.model', 'Model'),
('en', 'settings', 'admin.aiAgent.modelPlaceholder', 'e.g. gpt-4, claude-3-sonnet'),
('en', 'settings', 'admin.aiAgent.apiKey', 'API Key'),
('en', 'settings', 'admin.aiAgent.apiKeyPlaceholder', 'Enter API key'),
('en', 'settings', 'admin.aiAgent.baseUrl', 'Base URL (optional)'),
('en', 'settings', 'admin.aiAgent.baseUrlPlaceholder', 'Custom API endpoint URL'),
('en', 'settings', 'admin.aiAgent.testConnection', 'Test Connection'),
('en', 'settings', 'admin.aiAgent.testSuccess', 'Connection Successful'),
('en', 'settings', 'admin.aiAgent.testFailed', 'Connection Failed'),
('en', 'settings', 'admin.aiAgent.saveSuccess', 'Settings Saved'),
('en', 'settings', 'admin.aiAgent.saveFailed', 'Save Failed'),
('en', 'settings', 'admin.aiAgent.disabled', 'AI Agent Disabled'),
('en', 'settings', 'admin.aiAgent.loadFailed', 'Load Failed'),
('en', 'settings', 'admin.aiAgent.advancedParams', 'Advanced Parameters'),
('en', 'settings', 'admin.aiAgent.advancedParamsDescription', 'Fine-tune AI model behavior'),
('en', 'settings', 'admin.aiAgent.advancedParamsInfo', 'These parameters affect the quality and style of AI responses. Only modify them if you understand their effects.'),
('en', 'settings', 'admin.aiAgent.maxTokens', 'Max Tokens'),
('en', 'settings', 'admin.aiAgent.maxTokensTooltip', 'Maximum response length in tokens. Higher values allow longer responses but cost more.'),
('en', 'settings', 'admin.aiAgent.temperature', 'Temperature'),
('en', 'settings', 'admin.aiAgent.temperatureTooltip', 'Controls response creativity. 0.0 = deterministic, 2.0 = very creative. Recommended: 0.7'),
('en', 'settings', 'admin.aiAgent.topP', 'Top P'),
('en', 'settings', 'admin.aiAgent.topPTooltip', 'Nucleus sampling parameter. Lower values produce more focused, higher values more diverse responses.'),
('en', 'settings', 'admin.aiAgent.validation.required', 'API key and model are required'),
('en', 'settings', 'admin.aiAgent.validation.maxTokensRange', 'Max tokens must be between 1 and 100,000'),
('en', 'settings', 'admin.aiAgent.validation.temperatureRange', 'Temperature must be between 0.0 and 2.0'),
('en', 'settings', 'admin.aiAgent.validation.topPRange', 'Top P must be between 0.0 and 1.0')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- TTS Provider Config Panel fordítások (TTSProviderConfigPanel.svelte)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'admin.ttsProvider.title', 'TTS Provider konfiguráció'),
('hu', 'settings', 'admin.ttsProvider.description', 'Központi TTS Provider beállítások kezelése'),
('hu', 'settings', 'admin.ttsProvider.info', 'A TTS Provider konfiguráció határozza meg, hogy melyik szövegfelolvasó szolgáltatót használja a rendszer.'),
('hu', 'settings', 'admin.ttsProvider.enableTitle', 'TTS Provider engedélyezése'),
('hu', 'settings', 'admin.ttsProvider.enableDescription', 'TTS Provider funkciók globális engedélyezése vagy letiltása'),
('hu', 'settings', 'admin.ttsProvider.enableInfo', 'Ha ki van kapcsolva, a szövegfelolvasás funkciók nem lesznek elérhetők a rendszerben. Ez magában foglalja az AI asszisztens válaszainak felolvasását és minden kapcsolódó funkciót.'),
('hu', 'settings', 'admin.ttsProvider.disabled', 'TTS Provider kikapcsolva'),
('hu', 'settings', 'admin.ttsProvider.enableAIAgentFirst', 'Kérjük, engedélyezze az AI ügynököt az AI ügynök beállítások oldalon.'),
('hu', 'settings', 'admin.ttsProvider.active', 'Aktív konfiguráció'),
('hu', 'settings', 'admin.ttsProvider.inactive', 'Nincs aktív konfiguráció'),
('hu', 'settings', 'admin.ttsProvider.provider', 'Szolgáltató'),
('hu', 'settings', 'admin.ttsProvider.apiKey', 'API kulcs'),
('hu', 'settings', 'admin.ttsProvider.apiKeyPlaceholder', 'Adja meg az API kulcsot'),
('hu', 'settings', 'admin.ttsProvider.loadVoices', 'Hangok betöltése'),
('hu', 'settings', 'admin.ttsProvider.voice', 'Hang'),
('hu', 'settings', 'admin.ttsProvider.selectVoice', 'Válasszon hangot'),
('hu', 'settings', 'admin.ttsProvider.language', 'Nyelv'),
('hu', 'settings', 'admin.ttsProvider.testVoice', 'Hang tesztelése'),
('hu', 'settings', 'admin.ttsProvider.testSuccess', 'Teszt sikeres'),
('hu', 'settings', 'admin.ttsProvider.testFailed', 'Teszt sikertelen'),
('hu', 'settings', 'admin.ttsProvider.saveSuccess', 'Konfiguráció mentve'),
('hu', 'settings', 'admin.ttsProvider.saveFailed', 'Mentés sikertelen'),
('hu', 'settings', 'admin.ttsProvider.loadFailed', 'Betöltés sikertelen'),
('hu', 'settings', 'admin.ttsProvider.voicesLoaded', '{count} hang betöltve'),
('hu', 'settings', 'admin.ttsProvider.voicesLoadFailed', 'Hangok betöltése sikertelen'),
('hu', 'settings', 'admin.ttsProvider.browserVoicesInfo', 'Böngésző hangok automatikusan elérhetők'),
('hu', 'settings', 'admin.ttsProvider.aiAgentConfigMissing', 'AI Agent konfiguráció hiányzik'),
('hu', 'settings', 'admin.ttsProvider.validation.required', 'API kulcs és hang kiválasztása kötelező'),
('hu', 'settings', 'admin.ttsProvider.validation.apiKeyRequired', 'API kulcs megadása kötelező')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'admin.ttsProvider.title', 'TTS Provider Configuration'),
('en', 'settings', 'admin.ttsProvider.description', 'Manage central TTS Provider settings'),
('en', 'settings', 'admin.ttsProvider.info', 'The TTS Provider configuration determines which text-to-speech service the system uses.'),
('en', 'settings', 'admin.ttsProvider.enableTitle', 'Enable TTS Provider'),
('en', 'settings', 'admin.ttsProvider.enableDescription', 'Globally enable or disable TTS Provider features'),
('en', 'settings', 'admin.ttsProvider.enableInfo', 'When disabled, text-to-speech features will not be available in the system. This includes reading AI assistant responses and all related functionality.'),
('en', 'settings', 'admin.ttsProvider.disabled', 'TTS Provider Disabled'),
('en', 'settings', 'admin.ttsProvider.enableAIAgentFirst', 'Please enable the AI Agent in the AI Agent settings page.'),
('en', 'settings', 'admin.ttsProvider.active', 'Active Configuration'),
('en', 'settings', 'admin.ttsProvider.inactive', 'No Active Configuration'),
('en', 'settings', 'admin.ttsProvider.provider', 'Provider'),
('en', 'settings', 'admin.ttsProvider.apiKey', 'API Key'),
('en', 'settings', 'admin.ttsProvider.apiKeyPlaceholder', 'Enter API key'),
('en', 'settings', 'admin.ttsProvider.loadVoices', 'Load Voices'),
('en', 'settings', 'admin.ttsProvider.voice', 'Voice'),
('en', 'settings', 'admin.ttsProvider.selectVoice', 'Select voice'),
('en', 'settings', 'admin.ttsProvider.language', 'Language'),
('en', 'settings', 'admin.ttsProvider.testVoice', 'Test Voice'),
('en', 'settings', 'admin.ttsProvider.testSuccess', 'Test Successful'),
('en', 'settings', 'admin.ttsProvider.testFailed', 'Test Failed'),
('en', 'settings', 'admin.ttsProvider.saveSuccess', 'Configuration Saved'),
('en', 'settings', 'admin.ttsProvider.saveFailed', 'Save Failed'),
('en', 'settings', 'admin.ttsProvider.loadFailed', 'Load Failed'),
('en', 'settings', 'admin.ttsProvider.voicesLoaded', '{count} voices loaded'),
('en', 'settings', 'admin.ttsProvider.voicesLoadFailed', 'Failed to load voices'),
('en', 'settings', 'admin.ttsProvider.browserVoicesInfo', 'Browser voices are automatically available'),
('en', 'settings', 'admin.ttsProvider.aiAgentConfigMissing', 'AI Agent configuration is missing'),
('en', 'settings', 'admin.ttsProvider.validation.required', 'API key and voice selection are required'),
('en', 'settings', 'admin.ttsProvider.validation.apiKeyRequired', 'API key is required')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- AI Avatar telepítés fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'admin.aiAvatar.title', 'AI Avatar telepítés'),
('hu', 'settings', 'admin.aiAvatar.description', 'Avatar csomagok telepítése az AI asszisztenshez'),
('hu', 'settings', 'admin.aiAvatar.enableAIAgentFirst', 'Az AI Avatar telepítéséhez először engedélyezd az AI ügynököt.'),
('hu', 'settings', 'admin.aiAvatar.uploadTitle', 'Avatar csomag feltöltése'),
('hu', 'settings', 'admin.aiAvatar.uploadDescription', 'Telepíts új avatar csomagot .raconapkg fájlból'),
('hu', 'settings', 'admin.aiAvatar.uploadInfo', 'Az avatar csomagok (.raconapkg) tartalmazzák a 3D modellt és a kapcsolódó konfigurációt. A telepítés után az avatar elérhető lesz az AI asszisztens beállításokban.'),
('hu', 'settings', 'admin.aiAvatar.fileLabel', 'Avatar csomag fájl (.raconapkg)'),
('hu', 'settings', 'admin.aiAvatar.install', 'Telepítés'),
('hu', 'settings', 'admin.aiAvatar.installing', 'Telepítés...'),
('hu', 'settings', 'admin.aiAvatar.installSuccess', 'Avatar sikeresen telepítve: {name}'),
('hu', 'settings', 'admin.aiAvatar.installError', 'Avatar telepítése sikertelen'),
('hu', 'settings', 'admin.aiAvatar.validation.invalidFileType', 'Csak .raconapkg fájlok engedélyezettek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'admin.aiAvatar.title', 'AI Avatar Installation'),
('en', 'settings', 'admin.aiAvatar.description', 'Install avatar packages for the AI assistant'),
('en', 'settings', 'admin.aiAvatar.enableAIAgentFirst', 'To install AI Avatars, first enable the AI Agent.'),
('en', 'settings', 'admin.aiAvatar.uploadTitle', 'Upload Avatar Package'),
('en', 'settings', 'admin.aiAvatar.uploadDescription', 'Install a new avatar package from .raconapkg file'),
('en', 'settings', 'admin.aiAvatar.uploadInfo', 'Avatar packages (.raconapkg) contain the 3D model and related configuration. After installation, the avatar will be available in AI assistant settings.'),
('en', 'settings', 'admin.aiAvatar.fileLabel', 'Avatar package file (.raconapkg)'),
('en', 'settings', 'admin.aiAvatar.install', 'Install'),
('en', 'settings', 'admin.aiAvatar.installing', 'Installing...'),
('en', 'settings', 'admin.aiAvatar.installSuccess', 'Avatar installed successfully: {name}'),
('en', 'settings', 'admin.aiAvatar.installError', 'Avatar installation failed'),
('en', 'settings', 'admin.aiAvatar.validation.invalidFileType', 'Only .raconapkg files are allowed')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
-- -----------------------------------------------------------------------------
-- AI Avatar - Telepített avatarok lista (AIAvatarInstallPanel.svelte)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'admin.aiAvatar.installedAvatars', 'Telepített avatarok'),
('hu', 'settings', 'admin.aiAvatar.installedAvatarsDescription', 'Jelenleg telepített avatar csomagok kezelése'),
('hu', 'settings', 'admin.aiAvatar.noAvatarsInstalled', 'Nincs telepített avatar'),
('hu', 'settings', 'admin.aiAvatar.quality', 'Minőség'),
('hu', 'settings', 'admin.aiAvatar.description', 'Leírás'),
('hu', 'settings', 'admin.aiAvatar.delete', 'Törlés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'admin.aiAvatar.installedAvatars', 'Installed Avatars'),
('en', 'settings', 'admin.aiAvatar.installedAvatarsDescription', 'Manage currently installed avatar packages'),
('en', 'settings', 'admin.aiAvatar.noAvatarsInstalled', 'No avatars installed'),
('en', 'settings', 'admin.aiAvatar.quality', 'Quality'),
('en', 'settings', 'admin.aiAvatar.description', 'Description'),
('en', 'settings', 'admin.aiAvatar.delete', 'Delete')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Tudásbázis (Knowledge Base) fordítások - MAGYAR
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'admin.knowledgeBase.loading', 'Betöltés...'),
('hu', 'settings', 'admin.knowledgeBase.statusLoadError', 'Hiba történt a státusz betöltése során'),
('hu', 'settings', 'admin.knowledgeBase.reindexSuccess', 'Újraindexelés sikeresen befejezve'),
('hu', 'settings', 'admin.knowledgeBase.reindexError', 'Hiba történt az újraindexelés során'),
('hu', 'settings', 'admin.knowledgeBase.neverIndexed', 'Soha'),
('hu', 'settings', 'admin.knowledgeBase.totalDocuments', 'Összes dokumentum'),
('hu', 'settings', 'admin.knowledgeBase.totalChunks', 'Összes chunk'),
('hu', 'settings', 'admin.knowledgeBase.uptime', 'Üzemidő'),
('hu', 'settings', 'admin.knowledgeBase.languageDetails', 'Nyelvi részletek'),
('hu', 'settings', 'admin.knowledgeBase.loaded', 'Betöltve'),
('hu', 'settings', 'admin.knowledgeBase.notLoaded', 'Nincs betöltve'),
('hu', 'settings', 'admin.knowledgeBase.reindexing', 'Újraindexelés...'),
('hu', 'settings', 'admin.knowledgeBase.reindexLanguage', 'Újraindexelés'),
('hu', 'settings', 'admin.knowledgeBase.documents', 'Dokumentumok'),
('hu', 'settings', 'admin.knowledgeBase.chunks', 'Chunk-ok'),
('hu', 'settings', 'admin.knowledgeBase.lastIndexed', 'Utolsó indexelés'),
('hu', 'settings', 'admin.knowledgeBase.reindexingAll', 'Összes újraindexelése...'),
('hu', 'settings', 'admin.knowledgeBase.reindexAll', 'Összes újraindexelése'),
('hu', 'settings', 'admin.knowledgeBase.refreshStatus', 'Státusz frissítése'),
('hu', 'settings', 'admin.knowledgeBase.statusUnavailable', 'A státusz nem elérhető'),
('hu', 'settings', 'admin.knowledgeBase.retry', 'Újrapróbálás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Tudásbázis (Knowledge Base) fordítások - ANGOL
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'admin.knowledgeBase.loading', 'Loading...'),
('en', 'settings', 'admin.knowledgeBase.statusLoadError', 'Error loading status'),
('en', 'settings', 'admin.knowledgeBase.reindexSuccess', 'Reindexing completed successfully'),
('en', 'settings', 'admin.knowledgeBase.reindexError', 'Error during reindexing'),
('en', 'settings', 'admin.knowledgeBase.neverIndexed', 'Never'),
('en', 'settings', 'admin.knowledgeBase.totalDocuments', 'Total Documents'),
('en', 'settings', 'admin.knowledgeBase.totalChunks', 'Total Chunks'),
('en', 'settings', 'admin.knowledgeBase.uptime', 'Uptime'),
('en', 'settings', 'admin.knowledgeBase.languageDetails', 'Language Details'),
('en', 'settings', 'admin.knowledgeBase.loaded', 'Loaded'),
('en', 'settings', 'admin.knowledgeBase.notLoaded', 'Not Loaded'),
('en', 'settings', 'admin.knowledgeBase.reindexing', 'Reindexing...'),
('en', 'settings', 'admin.knowledgeBase.reindexLanguage', 'Reindex'),
('en', 'settings', 'admin.knowledgeBase.documents', 'Documents'),
('en', 'settings', 'admin.knowledgeBase.chunks', 'Chunks'),
('en', 'settings', 'admin.knowledgeBase.lastIndexed', 'Last Indexed'),
('en', 'settings', 'admin.knowledgeBase.reindexingAll', 'Reindexing All...'),
('en', 'settings', 'admin.knowledgeBase.reindexAll', 'Reindex All'),
('en', 'settings', 'admin.knowledgeBase.refreshStatus', 'Refresh Status'),
('en', 'settings', 'admin.knowledgeBase.statusUnavailable', 'Status unavailable'),
('en', 'settings', 'admin.knowledgeBase.retry', 'Retry')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Auth beállítások (AuthSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'menu.authentication', 'Hitelesítés'),
('hu', 'settings', 'admin.auth.title', 'Hitelesítési beállítások'),
('hu', 'settings', 'admin.auth.description', 'Regisztráció és social login beállítások kezelése'),
('hu', 'settings', 'admin.auth.registrationEnabled', 'Regisztráció engedélyezése'),
('hu', 'settings', 'admin.auth.registrationEnabledDescription', 'Engedélyezi az új felhasználók regisztrációját a rendszerben'),
('hu', 'settings', 'admin.auth.socialLoginEnabled', 'Social login engedélyezése'),
('hu', 'settings', 'admin.auth.socialLoginEnabledDescription', 'Engedélyezi a bejelentkezést külső szolgáltatókon keresztül (Google, stb.)'),
('hu', 'settings', 'admin.auth.saveSuccess', 'Hitelesítési beállítások mentve'),
('hu', 'settings', 'admin.auth.saveError', 'Hiba a beállítások mentése során'),
('hu', 'settings', 'admin.auth.loadError', 'Hiba a beállítások betöltése során'),
('en', 'settings', 'menu.authentication', 'Authentication'),
('en', 'settings', 'admin.auth.title', 'Authentication Settings'),
('en', 'settings', 'admin.auth.description', 'Manage registration and social login settings'),
('en', 'settings', 'admin.auth.registrationEnabled', 'Enable Registration'),
('en', 'settings', 'admin.auth.registrationEnabledDescription', 'Allow new users to register in the system'),
('en', 'settings', 'admin.auth.socialLoginEnabled', 'Enable Social Login'),
('en', 'settings', 'admin.auth.socialLoginEnabledDescription', 'Allow login through external providers (Google, etc.)'),
('en', 'settings', 'admin.auth.saveSuccess', 'Authentication settings saved'),
('en', 'settings', 'admin.auth.saveError', 'Error saving settings'),
('en', 'settings', 'admin.auth.loadError', 'Error loading settings')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
