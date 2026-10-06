-- Közös (shared scope) fájlok kezelése: új `files` erőforrás és `files.shared.manage` jogosultság.
-- Az azonosítók megegyeznek a seed adatokkal (auth/resources.sql, auth/permissions.sql),
-- így a seed később ugyanezeket a sorokat frissíti. Üres adatbázison is lefut.
INSERT INTO "auth"."resources" ("id", "name", "description")
VALUES (11, 'files', 'Fájlok kezelése')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "auth"."permissions" ("id", "name", "description", "resource_id")
SELECT 33, 'files.shared.manage', 'Közös fájlok kezelése', "id"
FROM "auth"."resources"
WHERE "name" = 'files'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Eddig a `settings.update` jogosultság engedte a közös fájlok kezelését:
-- aki (szerepkör vagy csoport) rendelkezik vele, az új jogosultságot is megkapja.
INSERT INTO "auth"."role_permissions" ("role_id", "permission_id")
SELECT rp."role_id", p_new."id"
FROM "auth"."role_permissions" rp
JOIN "auth"."permissions" p_old ON p_old."id" = rp."permission_id" AND p_old."name" = 'settings.update'
CROSS JOIN "auth"."permissions" p_new
WHERE p_new."name" = 'files.shared.manage'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "auth"."group_permissions" ("group_id", "permission_id")
SELECT gp."group_id", p_new."id"
FROM "auth"."group_permissions" gp
JOIN "auth"."permissions" p_old ON p_old."id" = gp."permission_id" AND p_old."name" = 'settings.update'
CROSS JOIN "auth"."permissions" p_new
WHERE p_new."name" = 'files.shared.manage'
ON CONFLICT DO NOTHING;
