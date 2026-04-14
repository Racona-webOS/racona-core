import db from '$lib/server/database';
import { eq, and, inArray } from 'drizzle-orm';
import {
	apps,
	roleAppAccess,
	groupAppAccess,
	userRoles,
	userGroups,
	type AppSelectModel,
	type LocalizedText
} from '@racona/database/schemas';

/**
 * AppEntity interface representing an app from the database
 */
export interface AppEntity {
	id: number;
	appId: string;
	name: LocalizedText;
	description: LocalizedText | null;
	version: string;
	icon: string;
	iconStyle: string;
	category: string;
	permissions: { resource: string; action: string }[];
	multiInstance: boolean;
	defaultSize: { width: number; height: number };
	minSize: { width: number; height: number };
	maxSize: { width: number; height: number } | null;
	author: string | null;
	keywords: string[];
	helpId: number | null;
	isActive: boolean;
	isPublic: boolean;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Repository interface for app operations
 */
export interface IAppRepository {
	findAll(): Promise<AppEntity[]>;
	findById(id: number): Promise<AppEntity | null>;
	findByAppId(appId: string): Promise<AppEntity | null>;
	findActiveApps(): Promise<AppEntity[]>;
	findAppsForUser(userId: number, locale: string): Promise<AppEntity[]>;
	searchAppsForUser(userId: number, query: string, locale: string): Promise<AppEntity[]>;
}

/**
 * Convert database model to AppEntity
 */
function toAppEntity(model: AppSelectModel): AppEntity {
	return {
		id: model.id,
		appId: model.appId,
		name: model.name,
		description: model.description ?? null,
		version: model.version,
		icon: model.icon,
		iconStyle: model.iconStyle ?? 'icon',
		category: model.category,
		permissions: model.permissions ?? [],
		multiInstance: model.multiInstance ?? false,
		defaultSize: model.defaultSize,
		minSize: model.minSize,
		maxSize: model.maxSize ?? null,
		author: model.author ?? null,
		keywords: model.keywords ?? [],
		helpId: model.helpId ?? null,
		isActive: model.isActive ?? true,
		isPublic: model.isPublic ?? false,
		sortOrder: model.sortOrder ?? 0,
		createdAt: model.createdAt ?? new Date(),
		updatedAt: model.updatedAt ?? new Date()
	};
}

/**
 * AppRepository implementation for database operations
 */
export class AppRepository implements IAppRepository {
	/**
	 * Find all apps
	 */
	async findAll(): Promise<AppEntity[]> {
		const result = await db.query.apps.findMany({
			orderBy: (apps, { asc }) => [asc(apps.sortOrder), asc(apps.appId)]
		});
		return result.map(toAppEntity);
	}

	/**
	 * Find app by numeric ID
	 */
	async findById(id: number): Promise<AppEntity | null> {
		const result = await db.query.apps.findFirst({
			where: eq(apps.id, id)
		});
		return result ? toAppEntity(result) : null;
	}

	/**
	 * Find app by string appId
	 */
	async findByAppId(appId: string): Promise<AppEntity | null> {
		const result = await db.query.apps.findFirst({
			where: eq(apps.appId, appId)
		});
		return result ? toAppEntity(result) : null;
	}

	/**
	 * Find all active apps
	 */
	async findActiveApps(): Promise<AppEntity[]> {
		const result = await db.query.apps.findMany({
			where: eq(apps.isActive, true),
			orderBy: (apps, { asc }) => [asc(apps.sortOrder), asc(apps.appId)]
		});
		return result.map(toAppEntity);
	}

	/**
	 * Find apps accessible to a user based on their roles and groups
	 * Returns deduplicated, active apps ordered by sort_order then localized name
	 * Includes public apps (isPublic=true) for all users
	 */
	async findAppsForUser(userId: number, locale: string): Promise<AppEntity[]> {
		// Get public apps (available to everyone)
		const publicApps = await db.query.apps.findMany({
			where: and(eq(apps.isActive, true), eq(apps.isPublic, true))
		});

		// Get user's role IDs
		const userRoleRecords = await db
			.select({ roleId: userRoles.roleId })
			.from(userRoles)
			.where(eq(userRoles.userId, userId));
		const roleIds = userRoleRecords.map((r) => r.roleId).filter((id): id is number => id !== null);

		// Get user's group IDs
		const userGroupRecords = await db
			.select({ groupId: userGroups.groupId })
			.from(userGroups)
			.where(eq(userGroups.userId, userId));
		const groupIds = userGroupRecords
			.map((g) => g.groupId)
			.filter((id): id is number => id !== null);

		// Get app IDs from role_app_access
		const roleAppIds: number[] = [];
		if (roleIds.length > 0) {
			const roleAppRecords = await db
				.select({ appId: roleAppAccess.appId })
				.from(roleAppAccess)
				.where(inArray(roleAppAccess.roleId, roleIds));
			roleAppIds.push(...roleAppRecords.map((r) => r.appId));
		}

		// Get app IDs from group_app_access
		const groupAppIds: number[] = [];
		if (groupIds.length > 0) {
			const groupAppRecords = await db
				.select({ appId: groupAppAccess.appId })
				.from(groupAppAccess)
				.where(inArray(groupAppAccess.groupId, groupIds));
			groupAppIds.push(...groupAppRecords.map((r) => r.appId));
		}

		// Combine and deduplicate app IDs
		const allAppIds = [...new Set([...roleAppIds, ...groupAppIds])];

		// Fetch role/group-based apps
		let userSpecificApps: AppEntity[] = [];
		if (allAppIds.length > 0) {
			const result = await db.query.apps.findMany({
				where: and(inArray(apps.id, allAppIds), eq(apps.isActive, true))
			});
			userSpecificApps = result.map(toAppEntity);
		}

		// Combine public apps and user-specific apps, deduplicate by app ID
		const allApps = [...publicApps.map(toAppEntity), ...userSpecificApps];
		const uniqueApps = Array.from(new Map(allApps.map((app) => [app.id, app])).values());

		// Sort by sort_order, then by localized name
		uniqueApps.sort((a, b) => {
			// First sort by sortOrder
			if (a.sortOrder !== b.sortOrder) {
				return a.sortOrder - b.sortOrder;
			}
			// Then sort by localized name
			const nameA = a.name[locale] || a.name['hu'] || '';
			const nameB = b.name[locale] || b.name['hu'] || '';
			return nameA.localeCompare(nameB, locale);
		});

		return uniqueApps;
	}

	/**
	 * Search apps for a user by name, description, or keywords (case-insensitive)
	 */
	async searchAppsForUser(userId: number, query: string, locale: string): Promise<AppEntity[]> {
		// First get all apps the user has access to
		const userApps = await this.findAppsForUser(userId, locale);

		if (userApps.length === 0 || !query.trim()) {
			return userApps;
		}

		const lowerQuery = query.toLowerCase().trim();

		// Filter apps by search query
		return userApps.filter((app) => {
			// Search in localized name
			const name = app.name[locale] || app.name['hu'] || '';
			if (name.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in all name translations
			for (const nameValue of Object.values(app.name)) {
				if (nameValue.toLowerCase().includes(lowerQuery)) {
					return true;
				}
			}

			// Search in localized description
			if (app.description) {
				const description = app.description[locale] || app.description['hu'] || '';
				if (description.toLowerCase().includes(lowerQuery)) {
					return true;
				}

				// Search in all description translations
				for (const descValue of Object.values(app.description)) {
					if (descValue.toLowerCase().includes(lowerQuery)) {
						return true;
					}
				}
			}

			// Search in keywords
			if (app.keywords && app.keywords.length > 0) {
				for (const keyword of app.keywords) {
					if (keyword.toLowerCase().includes(lowerQuery)) {
						return true;
					}
				}
			}

			return false;
		});
	}
}

// Singleton instance
export const appRepository = new AppRepository();
