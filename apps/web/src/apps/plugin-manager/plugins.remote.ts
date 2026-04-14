import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import db from '$lib/server/database';
import { apps } from '@racona/database/schemas';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';
import { getPluginDir, removeDir } from '$lib/server/plugins/utils/filesystem';
import { permissionRepository } from '$lib/server/database/repositories';
import { activityLogService } from '$lib/server/activity-log/service';

// Schemas
const pluginIdSchema = v.object({
	pluginId: v.pipe(v.string(), v.minLength(1))
});

const pluginListSchema = v.object({
	page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
	pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
	sortBy: v.optional(v.string(), 'name'),
	sortOrder: v.optional(v.union([v.literal('asc'), v.literal('desc')]), 'asc'),
	search: v.optional(v.string()),
	status: v.optional(v.union([v.literal('active'), v.literal('inactive')]))
});

// Types
export interface PluginListItem {
	id: number;
	appId: string;
	name: string;
	version: string;
	author: string | null;
	status: string;
	installedAt: Date | null;
	description: string | null;
}

export interface PluginDetail {
	id: number;
	appId: string;
	name: Record<string, string>;
	description: Record<string, string> | null;
	version: string;
	icon: string;
	category: string;
	author: string | null;
	pluginAuthor: string | null;
	pluginDescription: string | null;
	pluginPermissions: string[] | null;
	pluginDependencies: Record<string, string> | null;
	pluginMinWebosVersion: string | null;
	pluginStatus: string;
	pluginInstalledAt: Date | null;
	pluginUpdatedAt: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface PluginListResponse {
	success: boolean;
	error?: string;
	data: PluginListItem[];
	pagination: {
		page: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
	};
}

interface PluginDetailResponse {
	success: boolean;
	error?: string;
	data: PluginDetail | null;
}

/**
 * Get list of installed plugins with pagination and filtering.
 */
export const fetchPlugins = command(
	pluginListSchema,
	async ({ page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc', search, status }) => {
		const event = getRequestEvent();
		const { locals } = event;

		console.log('[fetchPlugins] Called with:', {
			page,
			pageSize,
			sortBy,
			sortOrder,
			search,
			status
		});

		// Check authentication
		if (!locals.user?.id) {
			console.log('[fetchPlugins] User not authenticated');
			return {
				success: false,
				error: 'User not authenticated',
				data: [],
				pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
			} satisfies PluginListResponse;
		}

		const locale = locals.locale || 'hu';
		console.log('[fetchPlugins] User authenticated, locale:', locale);

		try {
			// Build where conditions
			const conditions = [eq(apps.appType, 'plugin')];
			console.log('[fetchPlugins] Base condition: appType = plugin');

			if (status) {
				conditions.push(eq(apps.pluginStatus, status));
			}

			if (search) {
				const searchPattern = `%${search}%`;
				conditions.push(
					or(
						like(apps.appId, searchPattern),
						sql`${apps.name}::text ILIKE ${searchPattern}`,
						sql`${apps.pluginDescription} ILIKE ${searchPattern}`
					)!
				);
			}

			// Count total
			const countResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(apps)
				.where(and(...conditions));

			const totalCount = Number(countResult[0]?.count || 0);
			const totalPages = Math.ceil(totalCount / pageSize);
			console.log('[fetchPlugins] Total count:', totalCount, 'Total pages:', totalPages);

			// Determine sort column
			let orderByColumn;
			switch (sortBy) {
				case 'version':
					orderByColumn = apps.version;
					break;
				case 'installedAt':
					orderByColumn = apps.pluginInstalledAt;
					break;
				case 'status':
					orderByColumn = apps.pluginStatus;
					break;
				default:
					// Use raw SQL for JSONB field access with locale
					orderByColumn = sql.raw(`"platform"."apps"."name"->>'${locale}'`);
			}

			// Fetch data
			const result = await db
				.select({
					id: apps.id,
					appId: apps.appId,
					name: apps.name,
					version: apps.version,
					author: apps.pluginAuthor,
					status: apps.pluginStatus,
					installedAt: apps.pluginInstalledAt,
					description: apps.pluginDescription
				})
				.from(apps)
				.where(and(...conditions))
				.orderBy(sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn))
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			// Transform to PluginListItem
			const data: PluginListItem[] = result.map((row) => ({
				id: row.id,
				appId: row.appId,
				name:
					typeof row.name === 'object'
						? row.name[locale] || row.name['hu'] || row.appId
						: row.appId,
				version: row.version,
				author: row.author,
				status: row.status || 'active',
				installedAt: row.installedAt,
				description: row.description
			}));

			return {
				success: true,
				data,
				pagination: {
					page,
					pageSize,
					totalCount,
					totalPages
				}
			} satisfies PluginListResponse;
		} catch (error) {
			console.error('[PluginManager] Error fetching plugins:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				data: [],
				pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
			} satisfies PluginListResponse;
		}
	}
);

/**
 * Get detailed information about a specific plugin.
 */
export const fetchPluginDetail = command(pluginIdSchema, async ({ pluginId }) => {
	const event = getRequestEvent();
	const { locals } = event;

	// Check authentication
	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated',
			data: null
		} satisfies PluginDetailResponse;
	}

	try {
		const result = await db.query.apps.findFirst({
			where: and(eq(apps.appId, pluginId), eq(apps.appType, 'plugin'))
		});

		if (!result) {
			return {
				success: false,
				error: 'Plugin not found',
				data: null
			} satisfies PluginDetailResponse;
		}

		const data: PluginDetail = {
			id: result.id,
			appId: result.appId,
			name: result.name,
			description: result.description,
			version: result.version,
			icon: result.icon,
			category: result.category,
			author: result.author,
			pluginAuthor: result.pluginAuthor,
			pluginDescription: result.pluginDescription,
			pluginPermissions: result.pluginPermissions,
			pluginDependencies: result.pluginDependencies,
			pluginMinWebosVersion: result.pluginMinWebosVersion,
			pluginStatus: result.pluginStatus || 'active',
			pluginInstalledAt: result.pluginInstalledAt,
			pluginUpdatedAt: result.pluginUpdatedAt,
			isActive: result.isActive ?? true,
			createdAt: result.createdAt ?? new Date(),
			updatedAt: result.updatedAt ?? new Date()
		};

		return {
			success: true,
			data
		} satisfies PluginDetailResponse;
	} catch (error) {
		console.error('[PluginManager] Error fetching plugin detail:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			data: null
		} satisfies PluginDetailResponse;
	}
});

/**
 * Uninstall a plugin from the system.
 */
export const uninstallPlugin = command(pluginIdSchema, async ({ pluginId }) => {
	const event = getRequestEvent();
	const { locals } = event;

	// Check authentication
	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated'
		};
	}

	// Check if user has plugin.manual.install permission
	const userId = parseInt(locals.user.id);
	const permissions = await permissionRepository.findPermissionsForUser(userId);

	if (!permissions.includes('plugin.manual.install')) {
		return {
			success: false,
			error:
				'Insufficient permissions. Plugin management requires plugin.manual.install permission.'
		};
	}

	try {
		// Check if plugin exists
		const plugin = await db.query.apps.findFirst({
			where: and(eq(apps.appId, pluginId), eq(apps.appType, 'plugin'))
		});

		if (!plugin) {
			return {
				success: false,
				error: 'Plugin not found'
			};
		}

		// Delete plugin files from filesystem
		try {
			const pluginDir = getPluginDir(pluginId);
			await removeDir(pluginDir);
			console.log(`[PluginManager] Removed plugin files from: ${pluginDir}`);
		} catch (fsError) {
			console.error(`[PluginManager] Error removing plugin files:`, fsError);
			// Continue with database deletion even if file deletion fails
		}

		// Delete the plugin from database
		await db.delete(apps).where(eq(apps.appId, pluginId));

		console.log(`[PluginManager] Plugin ${pluginId} uninstalled successfully`);

		activityLogService.log({
			actionKey: 'plugin.uninstalled',
			userId: locals.user.id,
			resourceType: 'plugin',
			resourceId: pluginId,
			context: { name: plugin.appId, version: plugin.version }
		});

		return {
			success: true
		};
	} catch (error) {
		console.error('[PluginManager] Error uninstalling plugin:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
});
