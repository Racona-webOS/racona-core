-- =============================================================================
-- ACTIVITY NAMESPACE - Aktivitás napló action key fordítások
-- =============================================================================
-- Ez a namespace tartalmazza az activity log bejegyzések lefordított szövegeit.
-- Az action_key mező értéke a key oszlopnak felel meg.
-- A {{kulcs}} helyőrzők a context JSON mezőből kerülnek behelyettesítésre.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Felhasználó műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'user.login', 'Bejelentkezés'),
('hu', 'activity', 'user.logout', 'Kijelentkezés'),
('hu', 'activity', 'user.profile.updated', 'Profil frissítve'),
('hu', 'activity', 'user.activated', 'Felhasználó aktiválva'),
('hu', 'activity', 'user.deactivated', 'Felhasználó deaktiválva'),
('hu', 'activity', 'user.group.added', 'Felhasználó csoporthoz adva'),
('hu', 'activity', 'user.group.removed', 'Felhasználó csoportból eltávolítva'),
('hu', 'activity', 'user.role.assigned', 'Szerepkör hozzárendelve'),
('hu', 'activity', 'user.role.removed', 'Szerepkör eltávolítva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'role.created', 'Szerepkör létrehozva'),
('hu', 'activity', 'role.deleted', 'Szerepkör törölve'),
('hu', 'activity', 'role.permission.added', 'Jogosultság hozzáadva a szerepkörhöz'),
('hu', 'activity', 'role.permission.removed', 'Jogosultság eltávolítva a szerepkörből')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Plugin műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'plugin.installed', 'Plugin telepítve'),
('hu', 'activity', 'plugin.uninstalled', 'Plugin eltávolítva'),
('hu', 'activity', 'scheduler.job.enabled', 'Ütemezett feladat bekapcsolva: {{job}}'),
('hu', 'activity', 'scheduler.job.disabled', 'Ütemezett feladat kikapcsolva: {{job}}'),
('hu', 'activity', 'scheduler.job.run', 'Ütemezett feladat kézi futtatása: {{job}}')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- User actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'user.login', 'Login'),
('en', 'activity', 'user.logout', 'Logout'),
('en', 'activity', 'user.profile.updated', 'Profile updated'),
('en', 'activity', 'user.activated', 'User activated'),
('en', 'activity', 'user.deactivated', 'User deactivated'),
('en', 'activity', 'user.group.added', 'User added to group'),
('en', 'activity', 'user.group.removed', 'User removed from group'),
('en', 'activity', 'user.role.assigned', 'Role assigned'),
('en', 'activity', 'user.role.removed', 'Role removed')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'role.created', 'Role created'),
('en', 'activity', 'role.deleted', 'Role deleted'),
('en', 'activity', 'role.permission.added', 'Permission added to role'),
('en', 'activity', 'role.permission.removed', 'Permission removed from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Plugin actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'plugin.installed', 'Plugin installed'),
('en', 'activity', 'plugin.uninstalled', 'Plugin uninstalled'),
('en', 'activity', 'scheduler.job.enabled', 'Scheduled job enabled: {{job}}'),
('en', 'activity', 'scheduler.job.disabled', 'Scheduled job disabled: {{job}}'),
('en', 'activity', 'scheduler.job.run', 'Scheduled job run manually: {{job}}')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
