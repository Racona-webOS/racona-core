-- =============================================================================
-- DESKTOP NAMESPACE - Desktop környezet fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a desktop környezet szövegeit:
-- Desktop, Taskbar, Window, StartMenu komponensek
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Desktop kontextus menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'contextMenu.customizeBackground', 'Háttér testreszabása'),
('hu', 'desktop', 'contextMenu.customizeTaskbar', 'Tálca testreszabása'),
('hu', 'desktop', 'contextMenu.customizeStartMenu', 'Indító panel testreszabása'),
('hu', 'desktop', 'contextMenu.refresh', 'Frissítés'),
('hu', 'desktop', 'contextMenu.settings', 'Beállítások'),
('hu', 'desktop', 'contextMenu.arrangeIcons', 'Asztali ikonok sorba rendezése'),
('hu', 'desktop', 'contextMenu.hideIcons', 'Asztali ikonok elrejtése'),
('hu', 'desktop', 'contextMenu.showIcons', 'Asztali ikonok megjelenítése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak (Window) komponens
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'window.loading', 'Betöltés...'),
('hu', 'desktop', 'window.loadError', 'Nem sikerült betölteni a komponenst'),
('hu', 'desktop', 'window.guidCopySuccess', 'Guid link sikeres vágólapra helyezése!'),
('hu', 'desktop', 'window.guidCopyError', 'Guid link sikertelen vágólapra helyezése!'),
('hu', 'desktop', 'window.guidTooltip', 'Guid generálás ablak megosztásához')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Ablak vezérlő gombok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'window.controls.minimize', 'Minimalizálás'),
('hu', 'desktop', 'window.controls.maximize', 'Maximalizálás'),
('hu', 'desktop', 'window.controls.restore', 'Visszaállítás'),
('hu', 'desktop', 'window.controls.close', 'Bezárás'),
('hu', 'desktop', 'window.controls.help', 'Súgó'),
('hu', 'desktop', 'window.controls.link', 'Link')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'startMenu.search', 'Keresés...'),
('hu', 'desktop', 'startMenu.loading', 'Alkalmazások betöltése...'),
('hu', 'desktop', 'startMenu.noApps', 'Nincs elérhető alkalmazás'),
('hu', 'desktop', 'startMenu.noResults', 'Nem található a keresésnek megfelelő alkalmazás'),
('hu', 'desktop', 'startMenu.error', 'Hiba történt'),
('hu', 'desktop', 'startMenu.retry', 'Újrapróbálás'),
('hu', 'desktop', 'startMenu.refresh', 'Frissítés'),
('hu', 'desktop', 'startMenu.retrying', 'Újrapróbálás...'),
('hu', 'desktop', 'startMenu.refreshing', 'Frissítés...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü lábléc
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'startMenu.footer.signOut', 'Kijelentkezés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Videó háttér
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'videoBackground.notSupported', 'A böngésződ nem támogatja a videó lejátszást.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Desktop kontextus menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'contextMenu.customizeBackground', 'Customize Background'),
('en', 'desktop', 'contextMenu.customizeTaskbar', 'Customize Taskbar'),
('en', 'desktop', 'contextMenu.customizeStartMenu', 'Customize Start Menu'),
('en', 'desktop', 'contextMenu.refresh', 'Refresh'),
('en', 'desktop', 'contextMenu.settings', 'Settings'),
('en', 'desktop', 'contextMenu.arrangeIcons', 'Arrange Desktop Icons'),
('en', 'desktop', 'contextMenu.hideIcons', 'Hide Desktop Icons'),
('en', 'desktop', 'contextMenu.showIcons', 'Show Desktop Icons')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak (Window) komponens
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'window.loading', 'Loading...'),
('en', 'desktop', 'window.loadError', 'Failed to load component'),
('en', 'desktop', 'window.guidCopySuccess', 'Guid link copied to clipboard!'),
('en', 'desktop', 'window.guidCopyError', 'Failed to copy guid link to clipboard!'),
('en', 'desktop', 'window.guidTooltip', 'Generate guid for window sharing')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak vezérlő gombok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'window.controls.minimize', 'Minimize'),
('en', 'desktop', 'window.controls.maximize', 'Maximize'),
('en', 'desktop', 'window.controls.restore', 'Restore'),
('en', 'desktop', 'window.controls.close', 'Close'),
('en', 'desktop', 'window.controls.help', 'Help'),
('en', 'desktop', 'window.controls.link', 'Link')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'startMenu.search', 'Search...'),
('en', 'desktop', 'startMenu.loading', 'Loading applications...'),
('en', 'desktop', 'startMenu.noApps', 'No applications available'),
('en', 'desktop', 'startMenu.noResults', 'No applications match your search'),
('en', 'desktop', 'startMenu.error', 'An error occurred'),
('en', 'desktop', 'startMenu.retry', 'Try Again'),
('en', 'desktop', 'startMenu.refresh', 'Refresh'),
('en', 'desktop', 'startMenu.retrying', 'Retrying...'),
('en', 'desktop', 'startMenu.refreshing', 'Refreshing...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü lábléc
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'startMenu.footer.signOut', 'Sign Out')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Videó háttér
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'videoBackground.notSupported', 'Your browser does not support video playback.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Asztali parancsikon (DesktopShortcut)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'shortcut.open', 'Megnyitás'),
('hu', 'desktop', 'shortcut.rename', 'Átnevezés'),
('hu', 'desktop', 'shortcut.delete', 'Törlés'),
('hu', 'desktop', 'shortcut.renameDialog.title', 'Parancsikon átnevezése'),
('hu', 'desktop', 'shortcut.renameDialog.label', 'Név'),
('hu', 'desktop', 'shortcut.renameDialog.placeholder', 'Adja meg az új nevet'),
('hu', 'desktop', 'shortcut.renameDialog.save', 'Mentés'),
('hu', 'desktop', 'shortcut.renameDialog.saving', 'Mentés...'),
('hu', 'desktop', 'shortcut.deleteDialog.title', 'Parancsikon törlése'),
('hu', 'desktop', 'shortcut.deleteDialog.description', 'Biztosan törölni szeretné ezt a parancsikonot az asztalról?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca - Chat ikon
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'taskbar.messages', 'Üzenetek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tartalom terület
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'contentArea.loading', 'Betöltés...'),
('hu', 'desktop', 'contentArea.selectMenuItem', 'Válassz egy menüpontot a bal oldalon')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Asztali parancsikon (DesktopShortcut) - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'shortcut.open', 'Open'),
('en', 'desktop', 'shortcut.rename', 'Rename'),
('en', 'desktop', 'shortcut.delete', 'Delete'),
('en', 'desktop', 'shortcut.renameDialog.title', 'Rename Shortcut'),
('en', 'desktop', 'shortcut.renameDialog.label', 'Name'),
('en', 'desktop', 'shortcut.renameDialog.placeholder', 'Enter new name'),
('en', 'desktop', 'shortcut.renameDialog.save', 'Save'),
('en', 'desktop', 'shortcut.renameDialog.saving', 'Saving...'),
('en', 'desktop', 'shortcut.deleteDialog.title', 'Delete Shortcut'),
('en', 'desktop', 'shortcut.deleteDialog.description', 'Are you sure you want to delete this shortcut from the desktop?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Taskbar - Chat icon - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'taskbar.messages', 'Messages')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Content area - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'contentArea.loading', 'Loading...'),
('en', 'desktop', 'contentArea.selectMenuItem', 'Select a menu item on the left')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
