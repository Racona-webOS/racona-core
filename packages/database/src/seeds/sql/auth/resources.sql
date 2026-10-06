-- Resources seed data
INSERT INTO auth.resources (id, name, description) VALUES
  (1, 'users', 'Felhasználók kezelése'),
  (2, 'groups', 'Csoportok kezelése'),
  (3, 'roles', 'Szerepkörök kezelése'),
  (4, 'permissions', 'Jogosultságok kezelése'),
  (5, 'resources', 'Erőforrások kezelése'),
  (6, 'content', 'Tartalmak kezelése'),
  (7, 'settings', 'Rendszerbeállítások kezelése'),
  (8, 'log', 'Naplózás kezelése'),
  (9, 'plugin', 'Plugin kezelése'),
  (10, 'notifications', 'Értesítések kezelése'),
  (11, 'files', 'Fájlok kezelése')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
