-- =============================================================================
-- USER NAMESPACE - Felhasználók alkalmazás fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a Users app összes szövegét.
-- Szekciók: menu, users, groups, roles, permissions, resources, common
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'menu.users', 'Felhasználók'),
('hu', 'users', 'menu.accessManagement', 'Hozzáférés-kezelés'),
('hu', 'users', 'menu.groups', 'Csoportok'),
('hu', 'users', 'menu.roles', 'Szerepkörök'),
('hu', 'users', 'menu.permissions', 'Jogosultságok'),
('hu', 'users', 'menu.resources', 'Erőforrások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok (requiredPermission alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.users.users.view', 'Felhasználók megtekintése'),
('hu', 'users', 'permissions.users.groups.view', 'Csoportok megtekintése'),
('hu', 'users', 'permissions.users.roles.view', 'Szerepkörök megtekintése'),
('hu', 'users', 'permissions.users.permissions.view', 'Jogosultságok megtekintése'),
('hu', 'users', 'permissions.users.resources.view', 'Erőforrások megtekintése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.list.label', 'Felhasználók'),
('hu', 'users', 'users.list.description', 'A rendszerben regisztrált felhasználók listája')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.columns.name', 'Teljes név'),
('hu', 'users', 'users.columns.email', 'E-mail cím'),
('hu', 'users', 'users.columns.username', 'Felhasználónév'),
('hu', 'users', 'users.columns.emailVerified', 'E-mail megerősítve'),
('hu', 'users', 'users.columns.createdAt', 'Regisztráció dátuma'),
('hu', 'users', 'users.columns.isActive', 'Állapot'),
('hu', 'users', 'users.columns.provider', 'Provider')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók szűrők
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.filters.active', 'Aktív'),
('hu', 'users', 'users.filters.inactive', 'Inaktív'),
('hu', 'users', 'users.filters.reset', 'Szűrők törlése'),
('hu', 'users', 'users.filters.searchPlaceholder', 'Keresés név vagy e-mail alapján...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók provider típusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.providers.credential', 'E-mail/jelszó'),
('hu', 'users', 'users.providers.google', 'Google'),
('hu', 'users', 'users.providers.facebook', 'Facebook'),
('hu', 'users', 'users.providers.github', 'GitHub')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoportok lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.list.label', 'Csoportok'),
('hu', 'users', 'groups.list.description', 'A rendszerben definiált felhasználói csoportok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoportok oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.columns.name', 'Csoport neve'),
('hu', 'users', 'groups.columns.description', 'Leírás'),
('hu', 'users', 'groups.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkörök lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.list.label', 'Szerepkörök'),
('hu', 'users', 'roles.list.description', 'A rendszerben definiált szerepkörök')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkörök oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.columns.name', 'Szerepkör neve'),
('hu', 'users', 'roles.columns.description', 'Leírás'),
('hu', 'users', 'roles.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.list.label', 'Jogosultságok'),
('hu', 'users', 'permissions.list.description', 'A rendszerben definiált jogosultságok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.columns.name', 'Jogosultság neve'),
('hu', 'users', 'permissions.columns.description', 'Leírás'),
('hu', 'users', 'permissions.columns.resourceName', 'Erőforrás'),
('hu', 'users', 'permissions.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Erőforrások lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'resources.list.label', 'Erőforrások'),
('hu', 'users', 'resources.list.description', 'A rendszerben definiált védett erőforrások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Erőforrások oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'resources.columns.name', 'Erőforrás neve'),
('hu', 'users', 'resources.columns.description', 'Leírás'),
('hu', 'users', 'resources.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.actions.open', 'Részletek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.detail.title', 'Felhasználó részletei'),
('hu', 'users', 'users.detail.error', 'A felhasználó adatainak betöltése sikertelen'),
('hu', 'users', 'users.detail.groups', 'Csoportok'),
('hu', 'users', 'users.detail.roles', 'Szerepkörök'),
('hu', 'users', 'users.detail.noGroups', 'Nincs csoporthoz rendelve'),
('hu', 'users', 'users.detail.noRoles', 'Nincs szerepkörhöz rendelve'),
('hu', 'users', 'users.detail.addGroup', 'Hozzáadás'),
('hu', 'users', 'users.detail.addRole', 'Hozzáadás'),
('hu', 'users', 'users.detail.searchGroup', 'Keresés...'),
('hu', 'users', 'users.detail.searchRole', 'Keresés...'),
('hu', 'users', 'users.detail.noGroupsAvailable', 'Nincs elérhető csoport'),
('hu', 'users', 'users.detail.noRolesAvailable', 'Nincs elérhető szerepkör'),
('hu', 'users', 'users.detail.groupAdded', 'Felhasználó hozzáadva a csoporthoz'),
('hu', 'users', 'users.detail.groupRemoved', 'Felhasználó eltávolítva a csoportból'),
('hu', 'users', 'users.detail.roleAdded', 'Szerepkör hozzárendelve'),
('hu', 'users', 'users.detail.roleRemoved', 'Szerepkör eltávolítva'),
('hu', 'users', 'users.detail.groupAddError', 'Nem sikerült hozzáadni a csoporthoz'),
('hu', 'users', 'users.detail.groupRemoveError', 'Nem sikerült eltávolítani a csoportból'),
('hu', 'users', 'users.detail.roleAddError', 'Nem sikerült hozzárendelni a szerepkört'),
('hu', 'users', 'users.detail.roleRemoveError', 'Nem sikerült eltávolítani a szerepkört'),
('hu', 'users', 'users.detail.saveSuccess', 'A változtatások sikeresen mentve'),
('hu', 'users', 'users.detail.saveError', 'A változtatások mentése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó aktív státusz és inaktiválás
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.detail.accountStatus', 'Fiók állapota'),
('hu', 'users', 'users.detail.active', 'Aktív'),
('hu', 'users', 'users.detail.inactive', 'Inaktív'),
('hu', 'users', 'users.detail.deactivateUser', 'Felhasználó inaktiválása'),
('hu', 'users', 'users.detail.activateUser', 'Felhasználó aktiválása'),
('hu', 'users', 'users.detail.deactivateDescription', 'Biztosan inaktiválni szeretnéd ezt a felhasználót ({name} - {email})? Az inaktív felhasználó nem tud bejelentkezni a rendszerbe.'),
('hu', 'users', 'users.detail.activateDescription', 'Biztosan aktiválni szeretnéd ezt a felhasználót ({name} - {email})?'),
('hu', 'users', 'users.detail.deactivateConfirm', 'Inaktiválás'),
('hu', 'users', 'users.detail.activateConfirm', 'Aktiválás'),
('hu', 'users', 'users.detail.deactivateSuccess', 'A felhasználó sikeresen inaktiválva'),
('hu', 'users', 'users.detail.activateSuccess', 'A felhasználó sikeresen aktiválva'),
('hu', 'users', 'users.detail.deactivateError', 'A felhasználó állapotának módosítása sikertelen'),
('hu', 'users', 'users.detail.deleteUser', 'Felhasználó törlése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.detail.title', 'Csoport részletei'),
('hu', 'users', 'groups.detail.name', 'Csoport neve'),
('hu', 'users', 'groups.detail.description', 'Leírás'),
('hu', 'users', 'groups.detail.members', 'Csoport tagjai'),
('hu', 'users', 'groups.detail.error', 'A csoport adatainak betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.actions.removeUser', 'Eltávolítás a csoportból')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó hozzáadása csoporthoz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.addUser.button', 'Felhasználó hozzáadása'),
('hu', 'users', 'groups.addUser.title', 'Felhasználó hozzáadása a csoporthoz'),
('hu', 'users', 'groups.addUser.description', 'Válassz egy felhasználót, akit hozzá szeretnél adni ehhez a csoporthoz.'),
('hu', 'users', 'groups.addUser.selectLabel', 'Felhasználó'),
('hu', 'users', 'groups.addUser.selectPlaceholder', 'Válassz felhasználót...'),
('hu', 'users', 'groups.addUser.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'groups.addUser.noResults', 'Nincs találat.'),
('hu', 'users', 'groups.addUser.confirm', 'Hozzáadás'),
('hu', 'users', 'groups.addUser.success', 'A felhasználó sikeresen hozzáadva a csoporthoz'),
('hu', 'users', 'groups.addUser.error', 'A felhasználó hozzáadása sikertelen'),
('hu', 'users', 'groups.addUser.loadError', 'Az elérhető felhasználók betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó eltávolítása csoportból
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.removeUser.title', 'Felhasználó eltávolítása'),
('hu', 'users', 'groups.removeUser.description', 'Biztosan el szeretnéd távolítani ezt a felhasználót ({name} - {email}) a csoportból?'),
('hu', 'users', 'groups.removeUser.confirm', 'Eltávolítás'),
('hu', 'users', 'groups.removeUser.cancel', 'Mégse'),
('hu', 'users', 'groups.removeUser.success', 'A felhasználó sikeresen eltávolítva a csoportból'),
('hu', 'users', 'groups.removeUser.error', 'A felhasználó eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Közös hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'common.error.loadFailed', 'Az adatok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.detail.title', 'Szerepkör részletei'),
('hu', 'users', 'roles.detail.name', 'Szerepkör neve'),
('hu', 'users', 'roles.detail.description', 'Leírás'),
('hu', 'users', 'roles.detail.permissions', 'Jogosultságok'),
('hu', 'users', 'roles.detail.members', 'Tagok'),
('hu', 'users', 'roles.detail.error', 'A szerepkör adatainak betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.actions.removePermission', 'Eltávolítás a szerepkörből'),
('hu', 'users', 'roles.actions.removeUser', 'Eltávolítás a szerepkörből')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság hozzáadása szerepkörhöz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.addPermission.button', 'Jogosultság hozzáadása'),
('hu', 'users', 'roles.addPermission.title', 'Jogosultság hozzáadása a szerepkörhöz'),
('hu', 'users', 'roles.addPermission.description', 'Válassz egy jogosultságot, amit hozzá szeretnél adni ehhez a szerepkörhöz.'),
('hu', 'users', 'roles.addPermission.selectLabel', 'Jogosultság'),
('hu', 'users', 'roles.addPermission.selectPlaceholder', 'Válassz jogosultságot...'),
('hu', 'users', 'roles.addPermission.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'roles.addPermission.noResults', 'Nincs találat.'),
('hu', 'users', 'roles.addPermission.confirm', 'Hozzáadás'),
('hu', 'users', 'roles.addPermission.success', 'A jogosultság sikeresen hozzáadva a szerepkörhöz'),
('hu', 'users', 'roles.addPermission.error', 'A jogosultság hozzáadása sikertelen'),
('hu', 'users', 'roles.addPermission.loadError', 'Az elérhető jogosultságok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság eltávolítása szerepkörből
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.removePermission.title', 'Jogosultság eltávolítása'),
('hu', 'users', 'roles.removePermission.description', 'Biztosan el szeretnéd távolítani a(z) {name} jogosultságot a szerepkörből?'),
('hu', 'users', 'roles.removePermission.confirm', 'Eltávolítás'),
('hu', 'users', 'roles.removePermission.cancel', 'Mégse'),
('hu', 'users', 'roles.removePermission.success', 'A jogosultság sikeresen eltávolítva a szerepkörből'),
('hu', 'users', 'roles.removePermission.error', 'A jogosultság eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó hozzáadása szerepkörhöz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.addUser.button', 'Felhasználó hozzáadása'),
('hu', 'users', 'roles.addUser.title', 'Felhasználó hozzáadása a szerepkörhöz'),
('hu', 'users', 'roles.addUser.description', 'Válassz egy felhasználót, akit hozzá szeretnél adni ehhez a szerepkörhöz.'),
('hu', 'users', 'roles.addUser.selectLabel', 'Felhasználó'),
('hu', 'users', 'roles.addUser.selectPlaceholder', 'Válassz felhasználót...'),
('hu', 'users', 'roles.addUser.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'roles.addUser.noResults', 'Nincs találat.'),
('hu', 'users', 'roles.addUser.confirm', 'Hozzáadás'),
('hu', 'users', 'roles.addUser.success', 'A felhasználó sikeresen hozzáadva a szerepkörhöz'),
('hu', 'users', 'roles.addUser.error', 'A felhasználó hozzáadása sikertelen'),
('hu', 'users', 'roles.addUser.loadError', 'Az elérhető felhasználók betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó eltávolítása szerepkörből
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.removeUser.title', 'Felhasználó eltávolítása'),
('hu', 'users', 'roles.removeUser.description', 'Biztosan el szeretnéd távolítani ezt a felhasználót ({name} - {email}) a szerepkörből?'),
('hu', 'users', 'roles.removeUser.confirm', 'Eltávolítás'),
('hu', 'users', 'roles.removeUser.cancel', 'Mégse'),
('hu', 'users', 'roles.removeUser.success', 'A felhasználó sikeresen eltávolítva a szerepkörből'),
('hu', 'users', 'roles.removeUser.error', 'A felhasználó eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport jogosultság részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.detail.permissions', 'Jogosultságok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport jogosultság műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.actions.removePermission', 'Eltávolítás a csoportból')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság hozzáadása csoporthoz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.addPermission.button', 'Jogosultság hozzáadása'),
('hu', 'users', 'groups.addPermission.title', 'Jogosultság hozzáadása a csoporthoz'),
('hu', 'users', 'groups.addPermission.description', 'Válassz egy jogosultságot, amit hozzá szeretnél adni ehhez a csoporthoz.'),
('hu', 'users', 'groups.addPermission.selectLabel', 'Jogosultság'),
('hu', 'users', 'groups.addPermission.selectPlaceholder', 'Válassz jogosultságot...'),
('hu', 'users', 'groups.addPermission.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'groups.addPermission.noResults', 'Nincs találat.'),
('hu', 'users', 'groups.addPermission.confirm', 'Hozzáadás'),
('hu', 'users', 'groups.addPermission.success', 'A jogosultság sikeresen hozzáadva a csoporthoz'),
('hu', 'users', 'groups.addPermission.error', 'A jogosultság hozzáadása sikertelen'),
('hu', 'users', 'groups.addPermission.loadError', 'Az elérhető jogosultságok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság eltávolítása csoportból
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.removePermission.title', 'Jogosultság eltávolítása'),
('hu', 'users', 'groups.removePermission.description', 'Biztosan el szeretnéd távolítani a(z) {name} jogosultságot a csoportból?'),
('hu', 'users', 'groups.removePermission.confirm', 'Eltávolítás'),
('hu', 'users', 'groups.removePermission.cancel', 'Mégse'),
('hu', 'users', 'groups.removePermission.success', 'A jogosultság sikeresen eltávolítva a csoportból'),
('hu', 'users', 'groups.removePermission.error', 'A jogosultság eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Menu items
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'menu.users', 'Users'),
('en', 'users', 'menu.accessManagement', 'Access Management'),
('en', 'users', 'menu.groups', 'Groups'),
('en', 'users', 'menu.roles', 'Roles'),
('en', 'users', 'menu.permissions', 'Permissions'),
('en', 'users', 'menu.resources', 'Resources')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions (requiredPermission based)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.users.users.view', 'View users'),
('en', 'users', 'permissions.users.groups.view', 'View groups'),
('en', 'users', 'permissions.users.roles.view', 'View roles'),
('en', 'users', 'permissions.users.permissions.view', 'View permissions'),
('en', 'users', 'permissions.users.resources.view', 'View resources')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.list.label', 'Users'),
('en', 'users', 'users.list.description', 'List of registered users in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.columns.name', 'Full name'),
('en', 'users', 'users.columns.email', 'Email'),
('en', 'users', 'users.columns.username', 'Username'),
('en', 'users', 'users.columns.emailVerified', 'Email verified'),
('en', 'users', 'users.columns.createdAt', 'Registration date'),
('en', 'users', 'users.columns.isActive', 'Status'),
('en', 'users', 'users.columns.provider', 'Provider')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users filters
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.filters.active', 'Active'),
('en', 'users', 'users.filters.inactive', 'Inactive'),
('en', 'users', 'users.filters.reset', 'Reset filters'),
('en', 'users', 'users.filters.searchPlaceholder', 'Search by name or email...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users provider types
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.providers.credential', 'Email/Password'),
('en', 'users', 'users.providers.google', 'Google'),
('en', 'users', 'users.providers.facebook', 'Facebook'),
('en', 'users', 'users.providers.github', 'GitHub')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Groups list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.list.label', 'Groups'),
('en', 'users', 'groups.list.description', 'User groups defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Groups column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.columns.name', 'Group name'),
('en', 'users', 'groups.columns.description', 'Description'),
('en', 'users', 'groups.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Roles list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.list.label', 'Roles'),
('en', 'users', 'roles.list.description', 'Roles defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Roles column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.columns.name', 'Role name'),
('en', 'users', 'roles.columns.description', 'Description'),
('en', 'users', 'roles.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.list.label', 'Permissions'),
('en', 'users', 'permissions.list.description', 'Permissions defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.columns.name', 'Permission name'),
('en', 'users', 'permissions.columns.description', 'Description'),
('en', 'users', 'permissions.columns.resourceName', 'Resource'),
('en', 'users', 'permissions.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Resources list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'resources.list.label', 'Resources'),
('en', 'users', 'resources.list.description', 'Protected resources defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Resources column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'resources.columns.name', 'Resource name'),
('en', 'users', 'resources.columns.description', 'Description'),
('en', 'users', 'resources.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.actions.open', 'Details')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- User detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.detail.title', 'User details'),
('en', 'users', 'users.detail.error', 'Failed to load user data'),
('en', 'users', 'users.detail.groups', 'Groups'),
('en', 'users', 'users.detail.roles', 'Roles'),
('en', 'users', 'users.detail.noGroups', 'Not assigned to any group'),
('en', 'users', 'users.detail.noRoles', 'Not assigned to any role'),
('en', 'users', 'users.detail.addGroup', 'Add'),
('en', 'users', 'users.detail.addRole', 'Add'),
('en', 'users', 'users.detail.searchGroup', 'Search...'),
('en', 'users', 'users.detail.searchRole', 'Search...'),
('en', 'users', 'users.detail.noGroupsAvailable', 'No groups available'),
('en', 'users', 'users.detail.noRolesAvailable', 'No roles available'),
('en', 'users', 'users.detail.groupAdded', 'User added to group'),
('en', 'users', 'users.detail.groupRemoved', 'User removed from group'),
('en', 'users', 'users.detail.roleAdded', 'Role assigned'),
('en', 'users', 'users.detail.roleRemoved', 'Role removed'),
('en', 'users', 'users.detail.groupAddError', 'Failed to add to group'),
('en', 'users', 'users.detail.groupRemoveError', 'Failed to remove from group'),
('en', 'users', 'users.detail.roleAddError', 'Failed to assign role'),
('en', 'users', 'users.detail.roleRemoveError', 'Failed to remove role'),
('en', 'users', 'users.detail.saveSuccess', 'Changes saved successfully'),
('en', 'users', 'users.detail.saveError', 'Failed to save changes')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- User active status and deactivation
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.detail.accountStatus', 'Account status'),
('en', 'users', 'users.detail.active', 'Active'),
('en', 'users', 'users.detail.inactive', 'Inactive'),
('en', 'users', 'users.detail.deactivateUser', 'Deactivate user'),
('en', 'users', 'users.detail.activateUser', 'Activate user'),
('en', 'users', 'users.detail.deactivateDescription', 'Are you sure you want to deactivate this user ({name} - {email})? Inactive users cannot log in to the system.'),
('en', 'users', 'users.detail.activateDescription', 'Are you sure you want to activate this user ({name} - {email})?'),
('en', 'users', 'users.detail.deactivateConfirm', 'Deactivate'),
('en', 'users', 'users.detail.activateConfirm', 'Activate'),
('en', 'users', 'users.detail.deactivateSuccess', 'User successfully deactivated'),
('en', 'users', 'users.detail.activateSuccess', 'User successfully activated'),
('en', 'users', 'users.detail.deactivateError', 'Failed to change user status'),
('en', 'users', 'users.detail.deleteUser', 'Delete user')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.detail.title', 'Group details'),
('en', 'users', 'groups.detail.name', 'Group name'),
('en', 'users', 'groups.detail.description', 'Description'),
('en', 'users', 'groups.detail.members', 'Group members'),
('en', 'users', 'groups.detail.error', 'Failed to load group data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.actions.removeUser', 'Remove from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add user to group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.addUser.button', 'Add User'),
('en', 'users', 'groups.addUser.title', 'Add User to Group'),
('en', 'users', 'groups.addUser.description', 'Select a user to add to this group.'),
('en', 'users', 'groups.addUser.selectLabel', 'User'),
('en', 'users', 'groups.addUser.selectPlaceholder', 'Select user...'),
('en', 'users', 'groups.addUser.searchPlaceholder', 'Search...'),
('en', 'users', 'groups.addUser.noResults', 'No results found.'),
('en', 'users', 'groups.addUser.confirm', 'Add'),
('en', 'users', 'groups.addUser.success', 'User successfully added to group'),
('en', 'users', 'groups.addUser.error', 'Failed to add user to group'),
('en', 'users', 'groups.addUser.loadError', 'Failed to load available users')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove user from group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.removeUser.title', 'Remove User'),
('en', 'users', 'groups.removeUser.description', 'Are you sure you want to remove this user ({name} - {email}) from the group?'),
('en', 'users', 'groups.removeUser.confirm', 'Remove'),
('en', 'users', 'groups.removeUser.cancel', 'Cancel'),
('en', 'users', 'groups.removeUser.success', 'User successfully removed from group'),
('en', 'users', 'groups.removeUser.error', 'Failed to remove user from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Common error messages
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'common.error.loadFailed', 'Failed to load data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.detail.title', 'Role details'),
('en', 'users', 'roles.detail.name', 'Role name'),
('en', 'users', 'roles.detail.description', 'Description'),
('en', 'users', 'roles.detail.permissions', 'Permissions'),
('en', 'users', 'roles.detail.members', 'Members'),
('en', 'users', 'roles.detail.error', 'Failed to load role data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.actions.removePermission', 'Remove from role'),
('en', 'users', 'roles.actions.removeUser', 'Remove from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add permission to role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.addPermission.button', 'Add Permission'),
('en', 'users', 'roles.addPermission.title', 'Add Permission to Role'),
('en', 'users', 'roles.addPermission.description', 'Select a permission to add to this role.'),
('en', 'users', 'roles.addPermission.selectLabel', 'Permission'),
('en', 'users', 'roles.addPermission.selectPlaceholder', 'Select permission...'),
('en', 'users', 'roles.addPermission.searchPlaceholder', 'Search...'),
('en', 'users', 'roles.addPermission.noResults', 'No results found.'),
('en', 'users', 'roles.addPermission.confirm', 'Add'),
('en', 'users', 'roles.addPermission.success', 'Permission successfully added to role'),
('en', 'users', 'roles.addPermission.error', 'Failed to add permission to role'),
('en', 'users', 'roles.addPermission.loadError', 'Failed to load available permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove permission from role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.removePermission.title', 'Remove Permission'),
('en', 'users', 'roles.removePermission.description', 'Are you sure you want to remove the {name} permission from this role?'),
('en', 'users', 'roles.removePermission.confirm', 'Remove'),
('en', 'users', 'roles.removePermission.cancel', 'Cancel'),
('en', 'users', 'roles.removePermission.success', 'Permission successfully removed from role'),
('en', 'users', 'roles.removePermission.error', 'Failed to remove permission from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add user to role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.addUser.button', 'Add User'),
('en', 'users', 'roles.addUser.title', 'Add User to Role'),
('en', 'users', 'roles.addUser.description', 'Select a user to add to this role.'),
('en', 'users', 'roles.addUser.selectLabel', 'User'),
('en', 'users', 'roles.addUser.selectPlaceholder', 'Select user...'),
('en', 'users', 'roles.addUser.searchPlaceholder', 'Search...'),
('en', 'users', 'roles.addUser.noResults', 'No results found.'),
('en', 'users', 'roles.addUser.confirm', 'Add'),
('en', 'users', 'roles.addUser.success', 'User successfully added to role'),
('en', 'users', 'roles.addUser.error', 'Failed to add user to role'),
('en', 'users', 'roles.addUser.loadError', 'Failed to load available users')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove user from role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.removeUser.title', 'Remove User'),
('en', 'users', 'roles.removeUser.description', 'Are you sure you want to remove this user ({name} - {email}) from this role?'),
('en', 'users', 'roles.removeUser.confirm', 'Remove'),
('en', 'users', 'roles.removeUser.cancel', 'Cancel'),
('en', 'users', 'roles.removeUser.success', 'User successfully removed from role'),
('en', 'users', 'roles.removeUser.error', 'Failed to remove user from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group detail - permissions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.detail.permissions', 'Permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group actions - permissions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.actions.removePermission', 'Remove from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add permission to group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.addPermission.button', 'Add Permission'),
('en', 'users', 'groups.addPermission.title', 'Add Permission to Group'),
('en', 'users', 'groups.addPermission.description', 'Select a permission to add to this group.'),
('en', 'users', 'groups.addPermission.selectLabel', 'Permission'),
('en', 'users', 'groups.addPermission.selectPlaceholder', 'Select permission...'),
('en', 'users', 'groups.addPermission.searchPlaceholder', 'Search...'),
('en', 'users', 'groups.addPermission.noResults', 'No results found.'),
('en', 'users', 'groups.addPermission.confirm', 'Add'),
('en', 'users', 'groups.addPermission.success', 'Permission successfully added to group'),
('en', 'users', 'groups.addPermission.error', 'Failed to add permission to group'),
('en', 'users', 'groups.addPermission.loadError', 'Failed to load available permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove permission from group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.removePermission.title', 'Remove Permission'),
('en', 'users', 'groups.removePermission.description', 'Are you sure you want to remove the {name} permission from this group?'),
('en', 'users', 'groups.removePermission.confirm', 'Remove'),
('en', 'users', 'groups.removePermission.cancel', 'Cancel'),
('en', 'users', 'groups.removePermission.success', 'Permission successfully removed from group'),
('en', 'users', 'groups.removePermission.error', 'Failed to remove permission from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör létrehozása
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.create.button', 'Új szerepkör'),
('hu', 'users', 'roles.create.title', 'Új szerepkör létrehozása'),
('hu', 'users', 'roles.create.confirm', 'Létrehozás'),
('hu', 'users', 'roles.create.success', 'A szerepkör sikeresen létrehozva'),
('hu', 'users', 'roles.create.error', 'A szerepkör létrehozása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Create role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.create.button', 'New Role'),
('en', 'users', 'roles.create.title', 'Create New Role'),
('en', 'users', 'roles.create.confirm', 'Create'),
('en', 'users', 'roles.create.success', 'Role created successfully'),
('en', 'users', 'roles.create.error', 'Failed to create role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport létrehozása
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.create.button', 'Új csoport'),
('hu', 'users', 'groups.create.title', 'Új csoport létrehozása'),
('hu', 'users', 'groups.create.confirm', 'Létrehozás'),
('hu', 'users', 'groups.create.success', 'A csoport sikeresen létrehozva'),
('hu', 'users', 'groups.create.error', 'A csoport létrehozása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Create group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.create.button', 'New Group'),
('en', 'users', 'groups.create.title', 'Create New Group'),
('en', 'users', 'groups.create.confirm', 'Create'),
('en', 'users', 'groups.create.success', 'Group created successfully'),
('en', 'users', 'groups.create.error', 'Failed to create group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör szerkesztése
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.edit.saveSuccess', 'A szerepkör sikeresen módosítva'),
('hu', 'users', 'roles.edit.saveError', 'A szerepkör módosítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Edit role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.edit.saveSuccess', 'Role updated successfully'),
('en', 'users', 'roles.edit.saveError', 'Failed to update role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport szerkesztése
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.edit.saveSuccess', 'A csoport sikeresen módosítva'),
('hu', 'users', 'groups.edit.saveError', 'A csoport módosítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Edit group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.edit.saveSuccess', 'Group updated successfully'),
('en', 'users', 'groups.edit.saveError', 'Failed to update group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör törlése (hu)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.delete.button', 'Törlés'),
('hu', 'users', 'roles.delete.title', 'Szerepkör törlése'),
('hu', 'users', 'roles.delete.description', 'Biztosan törölni szeretnéd a(z) {name} szerepkört? Ez a művelet nem vonható vissza, és az összes kapcsolódó felhasználó-hozzárendelés és jogosultság is törlődik.'),
('hu', 'users', 'roles.delete.confirm', 'Törlés'),
('hu', 'users', 'roles.delete.success', 'A szerepkör sikeresen törölve'),
('hu', 'users', 'roles.delete.error', 'A szerepkör törlése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Delete role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.delete.button', 'Delete'),
('en', 'users', 'roles.delete.title', 'Delete Role'),
('en', 'users', 'roles.delete.description', 'Are you sure you want to delete the {name} role? This action cannot be undone, and all related user assignments and permissions will also be removed.'),
('en', 'users', 'roles.delete.confirm', 'Delete'),
('en', 'users', 'roles.delete.success', 'Role deleted successfully'),
('en', 'users', 'roles.delete.error', 'Failed to delete role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport törlése (hu)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.delete.button', 'Törlés'),
('hu', 'users', 'groups.delete.title', 'Csoport törlése'),
('hu', 'users', 'groups.delete.description', 'Biztosan törölni szeretnéd a(z) {name} csoportot? Ez a művelet nem vonható vissza, és az összes kapcsolódó felhasználó-hozzárendelés és jogosultság is törlődik.'),
('hu', 'users', 'groups.delete.confirm', 'Törlés'),
('hu', 'users', 'groups.delete.success', 'A csoport sikeresen törölve'),
('hu', 'users', 'groups.delete.error', 'A csoport törlése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Delete group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.delete.button', 'Delete'),
('en', 'users', 'groups.delete.title', 'Delete Group'),
('en', 'users', 'groups.delete.description', 'Are you sure you want to delete the {name} group? This action cannot be undone, and all related user assignments and permissions will also be removed.'),
('en', 'users', 'groups.delete.confirm', 'Delete'),
('en', 'users', 'groups.delete.success', 'Group deleted successfully'),
('en', 'users', 'groups.delete.error', 'Failed to delete group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság és erőforrás részletek (PermissionDetail, ResourceDetail)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.detail.title', 'Jogosultság részletei'),
('hu', 'users', 'resources.detail.title', 'Erőforrás részletei')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.detail.title', 'Permission details'),
('en', 'users', 'resources.detail.title', 'Resource details')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
