/**
 * Admin Config Repository
 *
 * Centralizált admin-szintű konfigurációk kezelése (AI Assistant, Auth, Email, stb.)
 */

import db from '$lib/server/database';
import { adminConfig } from '@racona/database/schemas';
import type { AdminConfig, AdminConfigInsert } from '@racona/database/schemas';
import { eq, desc } from 'drizzle-orm';
import { encrypt, decrypt } from '$lib/server/utils/encryption';

export const adminConfigRepository = {
	/**
	 * Admin konfiguráció lekérése config_key alapján
	 */
	async getByConfigKey(configKey: string): Promise<AdminConfig | null> {
		const [config] = await db
			.select()
			.from(adminConfig)
			.where(eq(adminConfig.configKey, configKey));

		return config || null;
	},

	/**
	 * Admin konfiguráció létrehozása vagy frissítése
	 */
	async upsert(
		configKey: string,
		configData: Record<string, any>,
		createdBy: number
	): Promise<AdminConfig> {
		const existing = await this.getByConfigKey(configKey);

		if (existing) {
			// Frissítés
			const [updated] = await db
				.update(adminConfig)
				.set({
					configData,
					updatedAt: new Date()
				})
				.where(eq(adminConfig.configKey, configKey))
				.returning();

			return updated;
		} else {
			// Létrehozás
			const [created] = await db
				.insert(adminConfig)
				.values({
					configKey,
					configData,
					isActive: true,
					createdBy
				})
				.returning();

			return created;
		}
	},

	/**
	 * Admin konfiguráció törlése
	 */
	async delete(configKey: string): Promise<boolean> {
		const result = await db.delete(adminConfig).where(eq(adminConfig.configKey, configKey));

		return result.rowCount !== null && result.rowCount > 0;
	},

	/**
	 * Összes admin konfiguráció listázása
	 */
	async listAll(): Promise<AdminConfig[]> {
		return await db.select().from(adminConfig).orderBy(desc(adminConfig.updatedAt));
	}
};
