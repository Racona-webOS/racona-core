/**
 * Remote functions for the app registry system.
 * Core webOS functionality for fetching user-accessible apps from the database.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { appRepository, type AppEntity } from '$lib/server/database/repositories';
import type { AppMetadata, AppMobileSupport } from '$lib/types/window';
import type { AppMobileConfig, LocalizedText } from '@racona/database/schemas';

// Empty schema for parameterless queries
const emptySchema = v.object({});

// Category filter schema
const categoryFilterSchema = v.object({
	category: v.optional(v.string())
});

// Search schema
const searchSchema = v.object({
	query: v.pipe(v.string(), v.minLength(1))
});

/**
 * Response type for remote functions.
 */
interface AppRegistryResponse {
	success: boolean;
	error?: string;
	apps: AppMetadata[];
}

/**
 * Convert AppEntity to WindowAppMetadata format.
 * Requirements: 5.4 - Include all metadata fields needed for the Client_Registry.
 * @param entity - The app entity from the database.
 * @param locale - The user's locale preference.
 * @returns The converted AppMetadata object.
 */
function localize(text: LocalizedText | string, locale: string): string {
	if (typeof text === 'string') return text;
	return text[locale] || text['hu'] || text['en'] || Object.values(text)[0] || '';
}

/** Mobil támogatás a felhasználó nyelvén (a bejegyzések felirata lefordítva) */
function convertMobile(mobile: AppMobileConfig | null, locale: string): AppMobileSupport | undefined {
	if (!mobile) return undefined;
	return {
		entries: (mobile.entries ?? []).map((entry) => ({
			id: entry.id,
			label: localize(entry.label, locale),
			icon: entry.icon,
			component: entry.component
		}))
	};
}

function convertToWindowMetadata(entity: AppEntity, locale: string): AppMetadata {
	return {
		appName: entity.appId,
		title: entity.name[locale] || entity.name['hu'] || entity.appId,
		defaultSize: entity.defaultSize,
		icon: entity.icon,
		iconStyle: (entity.iconStyle as 'icon' | 'cover') || 'icon',
		category: entity.category,
		allowMultiple: entity.multiInstance,
		minSize: entity.minSize,
		maxSize: entity.maxSize ?? undefined,
		resizable: true,
		maximizable: true,
		minimizable: true,
		helpId: entity.helpId ?? undefined,
		parameters: {},
		mobile: convertMobile(entity.mobile, locale)
	};
}

/**
 * Get available apps for the authenticated user.
 * Requirements: 5.1, 5.2, 5.3, 5.4.
 *
 * @returns Apps accessible to the user based on their roles and groups.
 */
export const getUserApps = command(emptySchema, async (): Promise<AppRegistryResponse> => {
	const event = getRequestEvent();
	const { locals } = event;

	// Check authentication - Requirements: 5.2
	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated',
			apps: []
		};
	}

	const userId = parseInt(locals.user.id);
	const locale = locals.locale || 'hu';

	try {
		// Fetch apps based on user's roles and groups - Requirements: 5.1, 5.3
		const apps = await appRepository.findAppsForUser(userId, locale);

		// Convert to WindowAppMetadata format - Requirements: 5.4
		const windowApps = apps.map((app) => convertToWindowMetadata(app, locale));

		return {
			success: true,
			apps: windowApps
		};
	} catch (error) {
		console.error('[AppRegistry] Error fetching user apps:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			apps: []
		};
	}
});

/**
 * Get available apps for the authenticated user filtered by category.
 * Requirements: 5.5.
 *
 * @param category - Optional category to filter apps.
 * @returns Apps in the specified category accessible to the user.
 */
export const getUserAppsByCategory = command(
	categoryFilterSchema,
	async ({ category }): Promise<AppRegistryResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		// Check authentication
		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated',
				apps: []
			};
		}

		const userId = parseInt(locals.user.id);
		const locale = locals.locale || 'hu';

		try {
			// Fetch all apps for user
			let apps = await appRepository.findAppsForUser(userId, locale);

			// Filter by category if provided - Requirements: 5.5
			if (category) {
				apps = apps.filter((app) => app.category === category);
			}

			// Convert to WindowAppMetadata format
			const windowApps = apps.map((app) => convertToWindowMetadata(app, locale));

			return {
				success: true,
				apps: windowApps
			};
		} catch (error) {
			console.error('[AppRegistry] Error fetching apps by category:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				apps: []
			};
		}
	}
);

/**
 * Search apps for the authenticated user.
 * Requirements: 5.6.
 *
 * @param query - Search query to match against name, description, or keywords.
 * @returns Apps matching the search query accessible to the user.
 */
export const searchUserApps = command(
	searchSchema,
	async ({ query }): Promise<AppRegistryResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		// Check authentication
		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated',
				apps: []
			};
		}

		const userId = parseInt(locals.user.id);
		const locale = locals.locale || 'hu';

		try {
			// Search apps using repository - Requirements: 5.6
			const apps = await appRepository.searchAppsForUser(userId, query, locale);

			// Convert to WindowAppMetadata format
			const windowApps = apps.map((app) => convertToWindowMetadata(app, locale));

			return {
				success: true,
				apps: windowApps
			};
		} catch (error) {
			console.error('[AppRegistry] Error searching apps:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				apps: []
			};
		}
	}
);
