import { serial, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';
import { platformSchema as schema } from '../schema';
import { apps } from '../apps/apps';
import { createInsertSchema } from 'drizzle-valibot';
import * as v from 'valibot';

// Plugin-specifikus oszlopok típusai
export type PluginPermission =
	| 'database'
	| 'notifications'
	| 'file_access'
	| 'remote_functions'
	| 'user_data'
	| 'scheduler';

export type PluginDependencies = Record<string, string>;

// Plugin logs tábla
export const pluginLogs = schema.table(
	'plugin_logs',
	{
		id: serial('id').primaryKey(),
		pluginId: varchar('plugin_id', { length: 255 })
			.notNull()
			.references(() => apps.appId, { onDelete: 'cascade' }),
		eventType: varchar('event_type', { length: 50 }).notNull(),
		eventData: jsonb('event_data'),
		userId: varchar('user_id', { length: 255 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(table) => ({
		pluginIdIdx: index('idx_plugin_logs_plugin_id').on(table.pluginId),
		eventTypeIdx: index('idx_plugin_logs_event_type').on(table.eventType),
		createdAtIdx: index('idx_plugin_logs_created_at').on(table.createdAt)
	})
);

// Plugin permissions tábla
export const pluginPermissions = schema.table(
	'plugin_permissions',
	{
		id: serial('id').primaryKey(),
		pluginId: varchar('plugin_id', { length: 255 })
			.notNull()
			.references(() => apps.appId, { onDelete: 'cascade' }),
		roleId: varchar('role_id', { length: 255 }),
		groupId: varchar('group_id', { length: 255 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(table) => ({
		pluginIdIdx: index('idx_plugin_permissions_plugin_id').on(table.pluginId),
		roleIdIdx: index('idx_plugin_permissions_role_id').on(table.roleId),
		groupIdIdx: index('idx_plugin_permissions_group_id').on(table.groupId)
	})
);

// Plugin metrics tábla
export const pluginMetrics = schema.table(
	'plugin_metrics',
	{
		id: serial('id').primaryKey(),
		pluginId: varchar('plugin_id', { length: 255 })
			.notNull()
			.references(() => apps.appId, { onDelete: 'cascade' }),
		metricType: varchar('metric_type', { length: 50 }).notNull(),
		metricValue: varchar('metric_value', { length: 50 }).notNull(),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(table) => ({
		pluginIdIdx: index('idx_plugin_metrics_plugin_id').on(table.pluginId),
		metricTypeIdx: index('idx_plugin_metrics_metric_type').on(table.metricType),
		createdAtIdx: index('idx_plugin_metrics_created_at').on(table.createdAt)
	})
);

// Valibot schemas
const pluginLogSchema = createInsertSchema(pluginLogs);
const pluginPermissionSchema = createInsertSchema(pluginPermissions);
const pluginMetricSchema = createInsertSchema(pluginMetrics);

export { pluginLogSchema, pluginPermissionSchema, pluginMetricSchema };
export type PluginLogSchema = v.InferInput<typeof pluginLogSchema>;
export type PluginPermissionSchema = v.InferInput<typeof pluginPermissionSchema>;
export type PluginMetricSchema = v.InferInput<typeof pluginMetricSchema>;

export type PluginLogSelectModel = InferSelectModel<typeof pluginLogs>;
export type PluginPermissionSelectModel = InferSelectModel<typeof pluginPermissions>;
export type PluginMetricSelectModel = InferSelectModel<typeof pluginMetrics>;
