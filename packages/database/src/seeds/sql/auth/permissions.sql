-- Permissions seed data
INSERT INTO auth.permissions (id, name, description, resource_id) VALUES
  -- Users app - Users management
  (1, 'users.users.view', 'Felhasználók megtekintése', 1),
  (2, 'users.users.create', 'Felhasználók létrehozása', 1),
  (3, 'users.users.update', 'Felhasználók módosítása', 1),
  (4, 'users.users.delete', 'Felhasználók törlése', 1),

  -- Users app - Groups management
  (5, 'users.groups.view', 'Csoportok megtekintése', 2),
  (6, 'users.groups.create', 'Csoportok létrehozása', 2),
  (7, 'users.groups.update', 'Csoportok módosítása', 2),
  (8, 'users.groups.delete', 'Csoportok törlése', 2),

  -- Users app - Roles management
  (9, 'users.roles.view', 'Szerepkörök megtekintése', 3),
  (10, 'users.roles.create', 'Szerepkörök létrehozása', 3),
  (11, 'users.roles.update', 'Szerepkörök módosítása', 3),
  (12, 'users.roles.delete', 'Szerepkörök törlése', 3),

  -- Users app - Permissions management
  (13, 'users.permissions.view', 'Jogosultságok megtekintése', 4),
  (14, 'users.permissions.assign', 'Jogosultságok hozzárendelése', 4),

  -- Users app - Resources management
  (15, 'users.resources.view', 'Erőforrások megtekintése', 5),
  (16, 'users.resources.create', 'Erőforrások létrehozása', 5),
  (17, 'users.resources.update', 'Erőforrások módosítása', 5),
  (18, 'users.resources.delete', 'Erőforrások törlése', 5),

  -- Content management
  (19, 'content.view', 'Tartalmak megtekintése', 6),
  (20, 'content.create', 'Tartalmak létrehozása', 6),
  (21, 'content.update', 'Tartalmak módosítása', 6),
  (22, 'content.delete', 'Tartalmak törlése', 6),
  (23, 'content.publish', 'Tartalmak publikálása', 6),

  -- Settings management
  (24, 'settings.view', 'Beállítások megtekintése', 7),
  (25, 'settings.update', 'Beállítások módosítása', 7),
  (29, 'settings.admin.aiAssistant', 'AI asszisztens beállítások kezelése', 7),
  (30, 'settings.admin.auth', 'Hitelesítési beállítások kezelése', 7),

  -- Log management
  (26, 'log.error.view', 'Hibanapló megtekintése', 8),
  (27, 'log.activity.view', 'Tevékenységnapló megtekintése', 8),

  -- Plugin management
  (28, 'plugin.manual.install', 'Plugin manuális telepítése', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  resource_id = EXCLUDED.resource_id;
