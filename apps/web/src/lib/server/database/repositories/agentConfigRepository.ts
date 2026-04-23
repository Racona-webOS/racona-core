/**
 * Agent Config Repository
 *
 * AI Agent konfiguráció kezelése az adatbázisban.
 * Az API key-ek titkosítva vannak tárolva.
 */

import db from '$lib/server/database';
import { aiAgentConfigs } from '@racona/database/schemas';
import type { AiAgentConfigSelectModel } from '@racona/database/schemas';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt, maskApiKey } from '$lib/server/utils/encryption';

// Agent konfiguráció mentési adatok típusa
export type UpsertAgentConfigData = {
	provider: string;
	apiKey: string;
	modelName?: string | null;
	baseUrl?: string | null;
	maxTokens?: number | null;
	temperature?: string | null;
	topP?: string | null;
};

// Agent konfiguráció visszaadási típusa (maszkolt API key-vel)
export type AgentConfigWithMaskedKey = Omit<AiAgentConfigSelectModel, 'apiKey'> & {
	apiKeyMasked: string;
};

export const agentConfigRepository = {
	/**
	 * Új agent konfiguráció beszúrása vagy meglévő frissítése
	 */
	async upsertAgentConfig(
		userId: number,
		config: UpsertAgentConfigData
	): Promise<AiAgentConfigSelectModel> {
		// Titkosítjuk az API key-t
		const encryptedApiKey = await encrypt(config.apiKey);

		// Először deaktiváljuk az összes korábbi konfigurációt
		await db
			.update(aiAgentConfigs)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(aiAgentConfigs.userId, userId));

		// Beszúrjuk az új konfigurációt
		const [result] = await db
			.insert(aiAgentConfigs)
			.values({
				userId,
				provider: config.provider,
				apiKey: encryptedApiKey,
				modelName: config.modelName ?? null,
				baseUrl: config.baseUrl ?? null,
				maxTokens: config.maxTokens ?? 1000,
				temperature: config.temperature ?? '0.70',
				topP: config.topP ?? '0.90',
				isActive: true
			})
			.returning();

		return result;
	},

	/**
	 * Aktív agent konfiguráció lekérése (maszkolt API key-vel)
	 */
	async getActiveAgentConfig(userId: number): Promise<AgentConfigWithMaskedKey | null> {
		const [config] = await db
			.select()
			.from(aiAgentConfigs)
			.where(and(eq(aiAgentConfigs.userId, userId), eq(aiAgentConfigs.isActive, true)));

		if (!config) {
			return null;
		}

		// Maszkoljuk az API key-t
		const decryptedKey = await decrypt(config.apiKey);
		const maskedKey = maskApiKey(decryptedKey);

		return {
			...config,
			apiKeyMasked: maskedKey
		};
	},

	/**
	 * Aktív agent konfiguráció lekérése (valódi API key-vel, csak backend használatra!)
	 */
	async getActiveAgentConfigWithKey(userId: number): Promise<AiAgentConfigSelectModel | null> {
		const [config] = await db
			.select()
			.from(aiAgentConfigs)
			.where(and(eq(aiAgentConfigs.userId, userId), eq(aiAgentConfigs.isActive, true)));

		if (!config) {
			return null;
		}

		// Visszafejtjük az API key-t
		const decryptedKey = await decrypt(config.apiKey);

		return {
			...config,
			apiKey: decryptedKey
		};
	},

	/**
	 * Agent konfiguráció törlése
	 */
	async deleteAgentConfig(userId: number, configId: number): Promise<boolean> {
		const result = await db
			.delete(aiAgentConfigs)
			.where(and(eq(aiAgentConfigs.id, configId), eq(aiAgentConfigs.userId, userId)));

		return result.rowCount !== null && result.rowCount > 0;
	},

	/**
	 * Összes agent konfiguráció listázása (maszkolt API key-ekkel)
	 */
	async listAgentConfigs(userId: number): Promise<AgentConfigWithMaskedKey[]> {
		const configs = await db.select().from(aiAgentConfigs).where(eq(aiAgentConfigs.userId, userId));

		// Maszkoljuk az API key-eket
		const configsWithMaskedKeys = await Promise.all(
			configs.map(async (config) => {
				const decryptedKey = await decrypt(config.apiKey);
				const maskedKey = maskApiKey(decryptedKey);

				return {
					...config,
					apiKeyMasked: maskedKey
				};
			})
		);

		return configsWithMaskedKeys;
	}
};
