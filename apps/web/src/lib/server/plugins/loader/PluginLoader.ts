/**
 * Plugin Loader
 *
 * Pluginok dinamikus betöltése futásidőben.
 */

import type { LoadResult, PluginModule, PluginStatus } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import { getPluginDir } from '../utils/filesystem';
import db from '$lib/server/database';
import { apps, pluginLogs } from '@racona/database';
import { eq } from 'drizzle-orm';
import path from 'path';

/**
 * Plugin Loader osztály
 *
 * Felelős a pluginok dinamikus betöltéséért és inicializálásáért.
 */
export class PluginLoader {
	/**
	 * Plugin betöltése
	 *
	 * @param pluginId - Plugin azonosítója
	 * @param userId - Felhasználó azonosítója
	 * @param params - Opcionális paraméterek
	 * @returns Betöltési eredmény
	 */
	async loadPlugin(
		pluginId: string,
		userId: string,
		params?: Record<string, unknown>
	): Promise<LoadResult> {
		const startTime = Date.now();

		try {
			console.log(`[PluginLoader] Loading plugin: ${pluginId} for user: ${userId}`);

			// 1. Plugin státusz ellenőrzés
			const statusCheck = await this.checkPluginStatus(pluginId);
			if (!statusCheck.valid) {
				return {
					success: false,
					error: statusCheck.error
				};
			}

			// 2. Jogosultság ellenőrzés
			const hasPermission = await this.checkPermissions(pluginId, userId);
			if (!hasPermission) {
				await this.logEvent(pluginId, 'permission_denied', { userId });
				return {
					success: false,
					error: 'Permission denied: You do not have access to this plugin'
				};
			}

			// 3. Felhasználó és plugin adatok lekérdezése
			const { user, permissions } = await this.getUserAndPermissions(userId, pluginId);

			// 4. WebOS SDK inicializálása (Task 3.9)
			const { WebOSSDK } = await import('@elyos-dev/sdk');
			WebOSSDK.initialize(pluginId, user, params || {}, permissions);

			// 5. ESM modul betöltése
			const module = await this.importModule(pluginId);
			if (!module) {
				return {
					success: false,
					error: 'Failed to load plugin module'
				};
			}

			// 6. Betöltési metrika naplózása
			const loadTime = Date.now() - startTime;
			await this.logMetric(pluginId, 'load_time', loadTime);

			// 7. Betöltés esemény naplózása
			await this.logEvent(pluginId, 'load', {
				userId,
				loadTime,
				params
			});

			console.log(`[PluginLoader] Successfully loaded plugin: ${pluginId} in ${loadTime}ms`);

			return {
				success: true,
				component: module
			};
		} catch (error) {
			console.error(`[PluginLoader] Failed to load plugin ${pluginId}:`, error);

			// Hiba naplózása
			await this.logEvent(pluginId, 'load_error', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to load plugin'
			};
		}
	}

	/**
	 * Plugin státusz ellenőrzése
	 *
	 * Task 3.10: Plugin Loader - Státusz Ellenőrző
	 */
	private async checkPluginStatus(pluginId: string): Promise<{
		valid: boolean;
		error?: string;
		status?: PluginStatus;
	}> {
		try {
			const result = await db
				.select({
					pluginStatus: apps.pluginStatus,
					appType: apps.appType
				})
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			if (result.length === 0) {
				return {
					valid: false,
					error: 'Plugin not found'
				};
			}

			const { pluginStatus, appType } = result[0];

			// Ellenőrizzük, hogy plugin típusú-e
			if (appType !== 'plugin') {
				return {
					valid: false,
					error: 'Not a plugin application'
				};
			}

			// Státusz ellenőrzés
			if (pluginStatus === 'inactive') {
				return {
					valid: false,
					error: 'Plugin is inactive',
					status: 'inactive'
				};
			}

			if (pluginStatus === 'error') {
				return {
					valid: false,
					error: 'Plugin is in error state',
					status: 'error'
				};
			}

			return {
				valid: true,
				status: pluginStatus as PluginStatus
			};
		} catch (error) {
			console.error('[PluginLoader] Status check error:', error);
			return {
				valid: false,
				error: 'Failed to check plugin status'
			};
		}
	}

	/**
	 * Felhasználói jogosultságok ellenőrzése
	 *
	 * Task 3.7: Plugin Loader - Jogosultság Ellenőrző
	 */
	async checkPermissions(pluginId: string, userId: string): Promise<boolean> {
		try {
			// TODO: Implementálni a teljes jogosultság ellenőrzést
			// - Felhasználó szerepkörök lekérdezése
			// - Felhasználó csoportok lekérdezése
			// - Plugin jogosultságok lekérdezése (platform.plugin_permissions)
			// - Jogosultság egyeztetés

			// Egyelőre minden felhasználó hozzáférhet minden pluginhoz
			// Ez később ki lesz bővítve a teljes jogosultság rendszerrel

			console.log(
				`[PluginLoader] Permission check for user ${userId} on plugin ${pluginId}: granted (temporary)`
			);
			return true;
		} catch (error) {
			console.error('[PluginLoader] Permission check error:', error);
			return false;
		}
	}

	/**
	 * Felhasználó és jogosultságok lekérdezése
	 */
	private async getUserAndPermissions(
		userId: string,
		pluginId: string
	): Promise<{
		user: import('@racona/database').UserInfo;
		permissions: string[];
	}> {
		try {
			// Felhasználó adatok lekérdezése
			// TODO: Integrálni a meglévő auth rendszerrel
			const user: import('@racona/database').UserInfo = {
				id: userId,
				name: 'User', // TODO: Valós név lekérdezése
				email: 'user@example.com', // TODO: Valós email lekérdezése
				roles: ['user'], // TODO: Valós szerepkörök lekérdezése
				groups: [] // TODO: Valós csoportok lekérdezése
			};

			// Plugin jogosultságok lekérdezése
			const result = await db
				.select({
					pluginPermissions: apps.pluginPermissions
				})
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			const permissions =
				result.length > 0 && result[0].pluginPermissions
					? (result[0].pluginPermissions as string[])
					: [];

			return { user, permissions };
		} catch (error) {
			console.error('[PluginLoader] Failed to get user and permissions:', error);
			return {
				user: {
					id: userId,
					name: 'User',
					email: 'user@example.com',
					roles: ['user'],
					groups: []
				},
				permissions: []
			};
		}
	}

	/**
	 * ESM modul dinamikus importálása
	 *
	 * Task 3.8: Plugin Loader - ESM Modul Betöltő
	 */
	async importModule(pluginId: string): Promise<PluginModule | null> {
		try {
			// Plugin könyvtár és entry point meghatározása
			const pluginDir = getPluginDir(pluginId);

			// Manifest beolvasása az entry point meghatározásához
			const manifestPath = path.join(pluginDir, 'manifest.json');
			const manifestContent = await import('fs/promises').then((fs) =>
				fs.readFile(manifestPath, 'utf-8')
			);
			const manifest = JSON.parse(manifestContent);

			// Entry point útvonal
			const entryPath = path.join(pluginDir, manifest.entry);

			// Dinamikus import timeout-tal (5 másodperc)
			const module = await Promise.race([
				import(entryPath),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Plugin load timeout')), 5000)
				)
			]);

			// Ellenőrizzük, hogy van-e default export
			if (!module.default) {
				throw new Error('Plugin module must have a default export');
			}

			return module as PluginModule;
		} catch (error) {
			console.error(`[PluginLoader] Module import error for ${pluginId}:`, error);

			if (error instanceof Error && error.message === 'Plugin load timeout') {
				throw new Error(`${PluginErrorCode.PLUGIN_LOAD_TIMEOUT}: Plugin took too long to load`);
			}

			throw error;
		}
	}

	/**
	 * Plugin erőforrások tisztítása
	 */
	cleanup(pluginId: string): void {
		// SDK cleanup
		if (typeof window !== 'undefined') {
			import('@elyos-dev/sdk').then(({ WebOSSDK }) => {
				WebOSSDK.cleanup();
			});
		}

		// TODO: További cleanup műveletek
		// - Module cache tisztítás
		// - Event listener-ek eltávolítása
		// - Timeout-ok törlése

		console.log(`[PluginLoader] Cleanup for plugin: ${pluginId}`);
	}

	/**
	 * Esemény naplózása
	 */
	private async logEvent(
		pluginId: string,
		eventType: string,
		eventData?: Record<string, unknown>
	): Promise<void> {
		try {
			await db.insert(pluginLogs).values({
				pluginId,
				eventType,
				eventData: eventData || null,
				userId: (eventData?.userId as string | null) || null
			});
		} catch (error) {
			console.error('[PluginLoader] Failed to log event:', error);
		}
	}

	/**
	 * Metrika naplózása
	 */
	private async logMetric(
		pluginId: string,
		metricType: string,
		metricValue: number,
		metadata?: Record<string, unknown>
	): Promise<void> {
		try {
			const { pluginMetrics } = await import('@racona/database');

			await db.insert(pluginMetrics).values({
				pluginId,
				metricType,
				metricValue: metricValue.toString(),
				metadata: metadata || null
			});
		} catch (error) {
			console.error('[PluginLoader] Failed to log metric:', error);
		}
	}
}

/**
 * Singleton instance
 */
export const pluginLoader = new PluginLoader();
