-- =============================================================================
-- COMMON NAMESPACE - Általános, közös fordítások
-- =============================================================================
-- Ez a namespace tartalmazza az alkalmazás általános, több helyen használt
-- szövegeit, mint pl. gombok, állapotok, hibaüzenetek.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Általános gombok és műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'buttons.save', 'Mentés'),
('hu', 'common', 'buttons.cancel', 'Mégse'),
('hu', 'common', 'buttons.close', 'Bezárás'),
('hu', 'common', 'buttons.confirm', 'Megerősítés'),
('hu', 'common', 'buttons.delete', 'Törlés'),
('hu', 'common', 'buttons.edit', 'Szerkesztés'),
('hu', 'common', 'buttons.add', 'Hozzáadás'),
('hu', 'common', 'buttons.search', 'Keresés'),
('hu', 'common', 'buttons.refresh', 'Frissítés'),
('hu', 'common', 'buttons.retry', 'Újrapróbálás'),
('hu', 'common', 'buttons.back', 'Vissza'),
('hu', 'common', 'buttons.next', 'Következő'),
('hu', 'common', 'buttons.previous', 'Előző'),
('hu', 'common', 'buttons.submit', 'Küldés'),
('hu', 'common', 'buttons.reset', 'Visszaállítás'),
('hu', 'common', 'loading', 'Betöltés...'),
('hu', 'common', 'close', 'Bezárás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános állapotok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'status.loading', 'Betöltés...'),
('hu', 'common', 'status.saving', 'Mentés...'),
('hu', 'common', 'status.saved', 'Mentve'),
('hu', 'common', 'status.error', 'Hiba'),
('hu', 'common', 'status.success', 'Sikeres'),
('hu', 'common', 'status.pending', 'Folyamatban'),
('hu', 'common', 'status.active', 'Aktív'),
('hu', 'common', 'status.inactive', 'Inaktív'),
('hu', 'common', 'status.enabled', 'Engedélyezve'),
('hu', 'common', 'status.disabled', 'Letiltva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'errors.generic', 'Hiba történt. Kérjük próbálja újra.'),
('hu', 'common', 'errors.network', 'Hálózati hiba. Ellenőrizze az internetkapcsolatot.'),
('hu', 'common', 'errors.notFound', 'A keresett elem nem található.'),
('hu', 'common', 'errors.unauthorized', 'Nincs jogosultsága ehhez a művelethez.'),
('hu', 'common', 'errors.validation', 'Kérjük ellenőrizze a megadott adatokat.'),
('hu', 'common', 'errors.saveFailed', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános sikeres üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'success.saved', 'Sikeresen mentve'),
('hu', 'common', 'success.deleted', 'Sikeresen törölve'),
('hu', 'common', 'success.updated', 'Sikeresen frissítve'),
('hu', 'common', 'success.created', 'Sikeresen létrehozva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megerősítő dialógusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'confirm.delete', 'Biztosan törölni szeretné?'),
('hu', 'common', 'confirm.unsavedChanges', 'Nem mentett változtatások vannak. Biztosan kilép?'),
('hu', 'common', 'confirm.action', 'Biztosan végrehajtja ezt a műveletet?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hamarosan elérhető
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'comingSoon', 'Hamarosan elérhető...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Fájl feltöltés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'fileUpload.dragFilesHere', '<span class="font-semibold">Húzza ide a fájlokat</span>'),
('hu', 'common', 'fileUpload.orClickToBrowse', 'vagy kattintson a böngészéshez'),
('hu', 'common', 'fileUpload.clickOrDrag', 'Kattintson vagy húzza ide a fájlt'),
('hu', 'common', 'fileUpload.browse', 'Böngészés'),
('hu', 'common', 'fileUpload.browseFiles', 'Fájlok böngészése'),
('hu', 'common', 'fileUpload.uploadingInProgress', 'Feltöltés folyamatban...'),
('hu', 'common', 'fileUpload.uploadFiles', 'Feltöltés ({count} fájl)'),
('hu', 'common', 'fileUpload.cancel', 'Megszakítás'),
('hu', 'common', 'fileUpload.cancelUpload', 'Feltöltés megszakítása'),
('hu', 'common', 'fileUpload.removeFile', 'Fájl eltávolítása'),
('hu', 'common', 'fileUpload.allowed', 'Engedélyezett'),
('hu', 'common', 'fileUpload.allFileTypes', 'Minden fájltípus'),
('hu', 'common', 'fileUpload.allFileTypesAllowed', 'Minden fájltípus engedélyezett'),
('hu', 'common', 'fileUpload.max', 'Max'),
('hu', 'common', 'fileUpload.maxFiles', 'Max {count} fájl'),
('hu', 'common', 'fileUpload.status.pending', 'Várakozik'),
('hu', 'common', 'fileUpload.status.uploading', 'Feltöltés...'),
('hu', 'common', 'fileUpload.status.completed', 'Kész'),
('hu', 'common', 'fileUpload.status.error', 'Hiba')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- DataTable - általános táblázat feliratok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'dataTable.noResults', 'Nincs találat.'),
('hu', 'common', 'dataTable.loading', 'Betöltés...'),
('hu', 'common', 'dataTable.totalRows', 'Összesen'),
('hu', 'common', 'dataTable.rows', 'sor'),
('hu', 'common', 'dataTable.rowsPerPage', 'Sorok oldalanként'),
('hu', 'common', 'dataTable.previous', 'Előző'),
('hu', 'common', 'dataTable.next', 'Következő'),
('hu', 'common', 'dataTable.columns', 'Oszlopok'),
('hu', 'common', 'dataTable.toggleColumns', 'Oszlopok megjelenítése'),
('hu', 'common', 'dataTable.sortAsc', 'Növekvő'),
('hu', 'common', 'dataTable.sortDesc', 'Csökkenő'),
('hu', 'common', 'dataTable.hide', 'Elrejtés'),
('hu', 'common', 'dataTable.clearFilters', 'Szűrők törlése'),
('hu', 'common', 'dataTable.selected', 'kiválasztva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Általános gombok és műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'buttons.save', 'Save'),
('en', 'common', 'buttons.cancel', 'Cancel'),
('en', 'common', 'buttons.close', 'Close'),
('en', 'common', 'buttons.confirm', 'Confirm'),
('en', 'common', 'buttons.delete', 'Delete'),
('en', 'common', 'buttons.edit', 'Edit'),
('en', 'common', 'buttons.add', 'Add'),
('en', 'common', 'buttons.search', 'Search'),
('en', 'common', 'buttons.refresh', 'Refresh'),
('en', 'common', 'buttons.retry', 'Retry'),
('en', 'common', 'buttons.back', 'Back'),
('en', 'common', 'buttons.next', 'Next'),
('en', 'common', 'buttons.previous', 'Previous'),
('en', 'common', 'buttons.submit', 'Submit'),
('en', 'common', 'buttons.reset', 'Reset'),
('en', 'common', 'loading', 'Loading...'),
('en', 'common', 'close', 'Close')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános állapotok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'status.loading', 'Loading...'),
('en', 'common', 'status.saving', 'Saving...'),
('en', 'common', 'status.saved', 'Saved'),
('en', 'common', 'status.error', 'Error'),
('en', 'common', 'status.success', 'Success'),
('en', 'common', 'status.pending', 'Pending'),
('en', 'common', 'status.active', 'Active'),
('en', 'common', 'status.inactive', 'Inactive'),
('en', 'common', 'status.enabled', 'Enabled'),
('en', 'common', 'status.disabled', 'Disabled')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'errors.generic', 'An error occurred. Please try again.'),
('en', 'common', 'errors.network', 'Network error. Please check your connection.'),
('en', 'common', 'errors.notFound', 'The requested item was not found.'),
('en', 'common', 'errors.unauthorized', 'You are not authorized to perform this action.'),
('en', 'common', 'errors.validation', 'Please check the provided data.'),
('en', 'common', 'errors.saveFailed', 'Failed to save')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános sikeres üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'success.saved', 'Successfully saved'),
('en', 'common', 'success.deleted', 'Successfully deleted'),
('en', 'common', 'success.updated', 'Successfully updated'),
('en', 'common', 'success.created', 'Successfully created')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megerősítő dialógusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'confirm.delete', 'Are you sure you want to delete?'),
('en', 'common', 'confirm.unsavedChanges', 'You have unsaved changes. Are you sure you want to leave?'),
('en', 'common', 'confirm.action', 'Are you sure you want to perform this action?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hamarosan elérhető
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'comingSoon', 'Coming soon...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- File upload
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'fileUpload.dragFilesHere', '<span class="font-semibold">Drag files here</span>'),
('en', 'common', 'fileUpload.orClickToBrowse', 'or click to browse'),
('en', 'common', 'fileUpload.clickOrDrag', 'Click or drag file here'),
('en', 'common', 'fileUpload.browse', 'Browse'),
('en', 'common', 'fileUpload.browseFiles', 'Browse Files'),
('en', 'common', 'fileUpload.uploadingInProgress', 'Uploading in progress...'),
('en', 'common', 'fileUpload.uploadFiles', 'Upload ({count} files)'),
('en', 'common', 'fileUpload.cancel', 'Cancel'),
('en', 'common', 'fileUpload.cancelUpload', 'Cancel upload'),
('en', 'common', 'fileUpload.removeFile', 'Remove file'),
('en', 'common', 'fileUpload.allowed', 'Allowed'),
('en', 'common', 'fileUpload.allFileTypes', 'All file types'),
('en', 'common', 'fileUpload.allFileTypesAllowed', 'All file types allowed'),
('en', 'common', 'fileUpload.max', 'Max'),
('en', 'common', 'fileUpload.maxFiles', 'Max {count} files'),
('en', 'common', 'fileUpload.status.pending', 'Pending'),
('en', 'common', 'fileUpload.status.uploading', 'Uploading...'),
('en', 'common', 'fileUpload.status.completed', 'Completed'),
('en', 'common', 'fileUpload.status.error', 'Error')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- DataTable - general table labels
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'dataTable.noResults', 'No results.'),
('en', 'common', 'dataTable.loading', 'Loading...'),
('en', 'common', 'dataTable.totalRows', 'Total'),
('en', 'common', 'dataTable.rows', 'rows'),
('en', 'common', 'dataTable.rowsPerPage', 'Rows per page'),
('en', 'common', 'dataTable.previous', 'Previous'),
('en', 'common', 'dataTable.next', 'Next'),
('en', 'common', 'dataTable.columns', 'Columns'),
('en', 'common', 'dataTable.toggleColumns', 'Toggle columns'),
('en', 'common', 'dataTable.sortAsc', 'Ascending'),
('en', 'common', 'dataTable.sortDesc', 'Descending'),
('en', 'common', 'dataTable.hide', 'Hide'),
('en', 'common', 'dataTable.clearFilters', 'Clear filters'),
('en', 'common', 'dataTable.selected', 'selected')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- UI komponensek - ThemeSwitcher, ColorPicker, WindowLink, DataTable
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'themeSwitcher.toggle', 'Váltás {mode} módra'),
('hu', 'common', 'themeSwitcher.lightMode', 'világos'),
('hu', 'common', 'themeSwitcher.darkMode', 'sötét'),
('hu', 'common', 'colorPicker.hue', 'Árnyalat'),
('hu', 'common', 'colorPicker.preview', 'Előnézet'),
('hu', 'common', 'colorPicker.apply', 'Alkalmaz'),
('hu', 'common', 'windowLink.title', 'Alkalmazás megnyitása guid hivatkozás alapján'),
('hu', 'common', 'windowLink.pasteAndOpen', 'Guid beillesztés és alkalmazás megnyitása'),
('hu', 'common', 'windowLink.open', 'Megnyitás'),
('hu', 'common', 'windowLink.placeholder', 'Alkalmazás guid hivatkozás'),
('hu', 'common', 'dataTable.rowActions', 'Műveletek'),
('hu', 'common', 'pluginDialog.cancel', 'Mégse'),
('hu', 'common', 'pluginDialog.confirm', 'Megerősítés'),
('hu', 'common', 'pluginDialog.send', 'Küldés'),
('hu', 'common', 'sidebar.search', 'Keresés...'),
('hu', 'common', 'error.backToHome', 'Vissza a főoldalra'),
('hu', 'common', 'error.technicalInfo', 'Technikai információ')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- UI components - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'themeSwitcher.toggle', 'Switch to {mode} mode'),
('en', 'common', 'themeSwitcher.lightMode', 'light'),
('en', 'common', 'themeSwitcher.darkMode', 'dark'),
('en', 'common', 'colorPicker.hue', 'Hue'),
('en', 'common', 'colorPicker.preview', 'Preview'),
('en', 'common', 'colorPicker.apply', 'Apply'),
('en', 'common', 'windowLink.title', 'Open application by guid link'),
('en', 'common', 'windowLink.pasteAndOpen', 'Paste guid and open application'),
('en', 'common', 'windowLink.open', 'Open'),
('en', 'common', 'windowLink.placeholder', 'Application guid link'),
('en', 'common', 'dataTable.rowActions', 'Actions'),
('en', 'common', 'pluginDialog.cancel', 'Cancel'),
('en', 'common', 'pluginDialog.confirm', 'Confirm'),
('en', 'common', 'pluginDialog.send', 'Send'),
('en', 'common', 'sidebar.search', 'Search...'),
('en', 'common', 'error.backToHome', 'Back to home'),
('en', 'common', 'error.technicalInfo', 'Technical information')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
