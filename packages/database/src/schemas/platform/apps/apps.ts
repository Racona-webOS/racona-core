import {
	serial,
	varchar,
	boolean,
	integer,
	timestamp,
	jsonb,
	text,
	index
} from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';
import { platformSchema as schema } from '../schema';

import { createInsertSchema } from 'drizzle-valibot';
import * as v from 'valibot';

// Type definitions
export type LocalizedText = {
	hu: string;
	en: string;
	[key: string]: string;
};

export type WindowSize = {
	width: number;
	height: number;
	maximized?: boolean;
};

export type AppPermission = {
	resource: string;
	action: string;
};

// Valibot schemas for validation
const localizedTextSchema = v.intersect([
	v.object({
		hu: v.pipe(v.string(), v.minLength(1)),
		en: v.pipe(v.string(), v.minLength(1))
	}),
	v.record(v.string(), v.string())
]);

const optionalLocalizedTextSchema = v.optional(
	v.object({
		hu: v.optional(v.pipe(v.string(), v.minLength(1))),
		en: v.optional(v.pipe(v.string(), v.minLength(1)))
	})
);

const windowSizeSchema = v.object({
	width: v.pipe(v.number(), v.minValue(1)),
	height: v.pipe(v.number(), v.minValue(1)),
	maximized: v.optional(v.boolean())
});

const appPermissionSchema = v.object({
	resource: v.pipe(v.string(), v.minLength(1)),
	action: v.pipe(v.string(), v.minLength(1))
});

export const apps = schema.table(
	'apps',
	{
		id: serial('id').primaryKey(),
		appId: varchar('app_id', { length: 50 }).notNull().unique(),
		name: jsonb('name').notNull().$type<LocalizedText>(),
		description: jsonb('description').$type<LocalizedText>(),
		version: varchar('version', { length: 20 }).notNull(),
		icon: varchar('icon', { length: 100 }).notNull(),
		iconStyle: varchar('icon_style', { length: 20 }).default('icon'), // 'icon' or 'cover'
		category: varchar('category', { length: 50 }).notNull(),
		permissions: jsonb('permissions').$type<AppPermission[]>().default([]),
		multiInstance: boolean('multi_instance').default(false),
		defaultSize: jsonb('default_size').notNull().$type<WindowSize>(),
		minSize: jsonb('min_size').notNull().$type<WindowSize>(),
		maxSize: jsonb('max_size').$type<WindowSize>(),
		author: varchar('author', { length: 100 }),
		keywords: jsonb('keywords').$type<string[]>().default([]),
		helpId: integer('help_id'),
		isActive: boolean('is_active').default(true),
		isPublic: boolean('is_public').default(false),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

		// Plugin-specifikus oszlopok
		appType: varchar('app_type', { length: 20 }).default('core'),
		pluginVersion: varchar('plugin_version', { length: 20 }),
		pluginAuthor: varchar('plugin_author', { length: 255 }),
		pluginDescription: text('plugin_description'),
		pluginPermissions: jsonb('plugin_permissions').$type<string[]>(),
		pluginDependencies: jsonb('plugin_dependencies').$type<Record<string, string>>(),
		pluginMinWebosVersion: varchar('plugin_min_webos_version', { length: 20 }),
		pluginStatus: varchar('plugin_status', { length: 20 }).default('active'),
		pluginInstalledAt: timestamp('plugin_installed_at', { withTimezone: true }),
		pluginUpdatedAt: timestamp('plugin_updated_at', { withTimezone: true }),
		sidebarComponent: varchar('sidebar_component', { length: 100 }) // Sidebar komponens neve (opcionális)
	},
	(table) => ({
		appTypeIdx: index('idx_apps_app_type').on(table.appType),
		pluginStatusIdx: index('idx_apps_plugin_status').on(table.pluginStatus)
	})
);

const appSchema = createInsertSchema(apps, {
	name: localizedTextSchema,
	description: optionalLocalizedTextSchema,
	permissions: v.optional(v.array(appPermissionSchema)),
	defaultSize: windowSizeSchema,
	minSize: windowSizeSchema,
	maxSize: v.optional(windowSizeSchema),
	keywords: v.optional(v.array(v.string()))
});

export { appSchema };
export type AppSchema = v.InferInput<typeof appSchema>;
export type AppSelectModel = InferSelectModel<typeof apps>;
