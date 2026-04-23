-- Role permissions seed data

-- Sysadmin role: all permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 1, id FROM auth.permissions
ON CONFLICT DO NOTHING;

-- Admin role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  -- Users app permissions
  (2, 1),  -- users.users.view
  (2, 2),  -- users.users.create
  (2, 3),  -- users.users.update
  (2, 5),  -- users.groups.view
  (2, 6),  -- users.groups.create
  (2, 7),  -- users.groups.update
  (2, 9),  -- users.roles.view
  (2, 10), -- users.roles.create
  (2, 11), -- users.roles.update
  (2, 13), -- users.permissions.view
  (2, 15), -- users.resources.view
  (2, 16), -- users.resources.create
  (2, 17), -- users.resources.update
  -- Content permissions
  (2, 19), -- content.view
  (2, 20), -- content.create
  (2, 21), -- content.update
  (2, 22), -- content.delete
  (2, 23), -- content.publish
  -- Settings permissions
  (2, 24), -- settings.view
  (2, 25), -- settings.update
  (2, 29), -- settings.admin.aiAssistant
  -- Log permissions
  (2, 26), -- log.error.view
  (2, 27), -- log.activity.view
  -- Plugin permissions
  (2, 28)  -- plugin.manual.install
ON CONFLICT DO NOTHING;

-- Editor role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  (3, 19), -- content.view
  (3, 20), -- content.create
  (3, 21), -- content.update
  (3, 23)  -- content.publish
ON CONFLICT DO NOTHING;

-- User role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  (4, 19)  -- content.view
ON CONFLICT DO NOTHING;
