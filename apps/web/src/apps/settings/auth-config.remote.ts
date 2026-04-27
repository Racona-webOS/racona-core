/**
 * Auth Configuration Remote Functions
 *
 * Admin-szintű hitelesítési beállítások kezelése (regisztráció, social login)
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { adminConfigRepository, permissionRepository } from '$lib/server/database/repositories';
import type { AuthConfig } from '@racona/database/schemas';

// ============================================================================
// Schemas
// ============================================================================

const updateAuthConfigSchema = v.object({
	registrationEnabled: v.boolean(),
	socialLoginEnabled: v.boolean()
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ellenőrzi, hogy a felhasználónak van-e admin jogosultsága az auth beállításokhoz
 */
async function checkAdminPermission(): Promise<{ hasPermission: boolean; userId: number }> {
	const event = getRequestEvent();
	const userId = event.locals.user?.id;

	if (!userId) {
		return { hasPermission: false, userId: 0 };
	}

	try {
		const permissions = await permissionRepository.findPermissionsForUser(Number(userId));
		const hasPermission = permissions.includes('settings.admin.auth');

		return { hasPermission, userId: Number(userId) };
	} catch (error) {
		console.error('Error checking admin permission:', error);
		return { hasPermission: false, userId: Number(userId) };
	}
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Auth konfiguráció lekérése
 */
export const getAuthConfig = query(
	async (): Promise<{ success: boolean; config?: AuthConfig; error?: string }> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.auth permission required'
			};
		}

		try {
			const config = await adminConfigRepository.getByConfigKey('auth');

			if (!config) {
				// Ha még nincs konfiguráció, visszaadjuk az alapértelmezett értékeket
				return {
					success: true,
					config: {
						registrationEnabled: true,
						socialLoginEnabled: true
					}
				};
			}

			return {
				success: true,
				config: config.configData as AuthConfig
			};
		} catch (error) {
			console.error('Error loading auth config:', error);
			return {
				success: false,
				error: 'Failed to load auth configuration'
			};
		}
	}
);

// ============================================================================
// Command Functions
// ============================================================================

/**
 * Auth konfiguráció frissítése
 */
export const updateAuthConfig = command(
	updateAuthConfigSchema,
	async ({
		registrationEnabled,
		socialLoginEnabled
	}): Promise<{ success: boolean; error?: string }> => {
		const { hasPermission, userId } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.auth permission required'
			};
		}

		try {
			const configData: AuthConfig = {
				registrationEnabled,
				socialLoginEnabled
			};

			// Mentés az adatbázisba
			await adminConfigRepository.upsert('auth', configData, userId);

			return { success: true };
		} catch (error) {
			console.error('Error updating auth config:', error);
			return {
				success: false,
				error: 'Failed to update auth configuration'
			};
		}
	}
);
