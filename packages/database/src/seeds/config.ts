/**
 * PostgreSQL extensions to enable.
 * These are installed in the 'extensions' schema to keep them separate from project tables.
 */
export const extensions = ['postgres-json-schema'];

/**
 * Seed configuration with dependency-based ordering.
 * Each seed defines its SQL file and dependencies.
 */

export interface SeedDefinition {
	file: string;
	dependsOn: string[];
	description?: string;
}

export interface ProcedureDefinition {
	file: string;
	description?: string;
}

export const seedConfig: Record<string, SeedDefinition> = {
	// Auth schema - base tables (no dependencies)
	resources: {
		file: 'auth/resources.sql',
		dependsOn: [],
		description: 'Resource definitions for permission system'
	},
	providers: {
		file: 'auth/providers.sql',
		dependsOn: [],
		description: 'Authentication providers'
	},
	groups: {
		file: 'auth/groups.sql',
		dependsOn: [],
		description: 'User groups'
	},
	roles: {
		file: 'auth/roles.sql',
		dependsOn: [],
		description: 'User roles'
	},

	// Auth schema - tables with dependencies
	permissions: {
		file: 'auth/permissions.sql',
		dependsOn: ['resources'],
		description: 'Permissions linked to resources'
	},
	role_permissions: {
		file: 'auth/role_permissions.sql',
		dependsOn: ['roles', 'permissions'],
		description: 'Role-permission assignments'
	},
	group_permissions: {
		file: 'auth/group_permissions.sql',
		dependsOn: ['groups', 'permissions'],
		description: 'Group-permission assignments'
	},
	users: {
		file: 'auth/users.sql',
		dependsOn: [],
		description: 'Initial users'
	},
	accounts: {
		file: 'auth/accounts.sql',
		dependsOn: ['users', 'providers'],
		description: 'User authentication accounts'
	},
	user_roles: {
		file: 'auth/user_roles.sql',
		dependsOn: ['users', 'roles'],
		description: 'User-role assignments'
	},
	user_groups: {
		file: 'auth/user_groups.sql',
		dependsOn: ['users', 'groups'],
		description: 'User-group assignments'
	},

	// Platform schema
	locales: {
		file: 'platform/locales.sql',
		dependsOn: [],
		description: 'Supported locales for i18n'
	},
	translations_common: {
		file: 'platform/translations_common.sql',
		dependsOn: ['locales'],
		description: 'Common translations (buttons, status, errors)'
	},
	translations_settings: {
		file: 'platform/translations_settings.sql',
		dependsOn: ['locales'],
		description: 'Settings app translations'
	},
	translations_log: {
		file: 'platform/translations_log.sql',
		dependsOn: ['locales'],
		description: 'Log app translations'
	},
	translations_desktop: {
		file: 'platform/translations_desktop.sql',
		dependsOn: ['locales'],
		description: 'Desktop environment translations (Window, Taskbar, StartMenu)'
	},
	translations_auth: {
		file: 'platform/translations_auth.sql',
		dependsOn: ['locales'],
		description: 'Authentication pages translations (sign-in, sign-up, verification)'
	},
	translations_user: {
		file: 'platform/translations_user.sql',
		dependsOn: ['locales'],
		description: 'Users app translations (menu, columns, lists)'
	},
	translations_user_apps: {
		file: 'platform/translations_user_apps.sql',
		dependsOn: ['locales'],
		description: 'Users app translations for app assignments (groups, roles)'
	},
	translations_notifications: {
		file: 'platform/translations_notifications.sql',
		dependsOn: ['locales'],
		description: 'Notification system translations (NotificationCenter component)'
	},
	translations_plugin_manager: {
		file: 'platform/translations_plugin_manager.sql',
		dependsOn: ['locales'],
		description: 'Plugin Manager app translations'
	},
	translations_chat: {
		file: 'platform/translations_chat.sql',
		dependsOn: ['locales'],
		description: 'Chat app translations (UserList, ConversationList, ChatWindow)'
	},
	translations_help: {
		file: 'platform/translations_help.sql',
		dependsOn: ['locales'],
		description: 'Help app translations'
	},
	translations_map: {
		file: 'platform/translations_map.sql',
		dependsOn: ['locales'],
		description: 'Map app translations'
	},
	translations_activity: {
		file: 'platform/translations_activity.sql',
		dependsOn: ['locales'],
		description: 'Activity log action key translations (activity namespace)'
	},
	translations_ai_assistant: {
		file: 'platform/translations_ai_assistant.sql',
		dependsOn: ['locales'],
		description: 'AI Assistant translations (panel, input, history)'
	},

	// Platform schema - AI avatars
	ai_avatars_default: {
		file: 'platform/ai_avatars_default.sql',
		dependsOn: [],
		description: 'Default AI avatar (Rico)'
	},

	// Platform schema - apps
	apps: {
		file: 'platform/apps.sql',
		dependsOn: ['roles', 'groups'],
		description: 'Application registry with metadata'
	},
	role_app_access: {
		file: 'auth/role_app_access.sql',
		dependsOn: ['apps', 'roles'],
		description: 'Role-app access assignments for access control'
	},
	group_app_access: {
		file: 'auth/group_app_access.sql',
		dependsOn: ['apps', 'groups'],
		description: 'Group-app access assignments for access control'
	},

	// Platform schema - email templates
	email_templates: {
		file: 'platform/email_templates.sql',
		dependsOn: ['locales'],
		description: 'Email templates for all system emails (HU/EN)'
	},

	// Platform schema - theme presets
	theme_presets: {
		file: 'platform/theme_presets.sql',
		dependsOn: ['locales'],
		description: 'Predefined theme presets for appearance customization'
	}
};

/**
 * Stored procedures to create/replace.
 * These are executed after seeds.
 */
export const procedureConfig: Record<string, ProcedureDefinition> = {
	// Auth schema procedures
	get_groups: {
		file: 'auth/getGroups.sql',
		description: 'Get groups by ID'
	},
	get_groups_2: {
		file: 'auth/getGroups2.sql',
		description: 'Get groups alternative'
	}

	// Platform schema procedures - add here when needed
};

/**
 * Tables to truncate before seeding (in reverse dependency order).
 * CASCADE will handle foreign key constraints.
 */

export const truncateOrder = [
	// Platform - runtime/user-generated data (no FK dependencies)
	'platform.plugin_metrics',
	'platform.plugin_logs',
	'platform.plugin_permissions',
	'platform.notifications',
	'platform.messages',
	'platform.conversations',
	'platform.error_logs',
	'platform.files',
	'platform.desktop_shortcuts',
	// Platform - AI avatar user configs (depends on ai_avatars)
	'platform.user_avatar_configs',
	'platform.ai_agent_configs',
	// Platform - seed data
	'auth.role_app_access',
	'auth.group_app_access',
	'platform.apps',
	'platform.ai_avatars',
	'platform.translations',
	'platform.locales',
	'platform.theme_presets',
	'platform.user_settings',
	'platform.email_logs',
	'platform.email_templates',
	// Auth - runtime data
	'auth.two_factors',
	'auth.user_roles',
	'auth.role_permissions',
	'auth.group_permissions',
	'auth.user_groups',
	'auth.verifications',
	'auth.sessions',
	'auth.accounts',
	'auth.audit_logs',
	'auth.users',
	'auth.permissions',
	'auth.roles',
	'auth.groups',
	'auth.resources',
	'auth.providers'
];
