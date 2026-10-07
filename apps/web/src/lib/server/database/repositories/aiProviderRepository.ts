/**
 * AI Provider Repository
 *
 * Adatbázis-alapú AI provider kezelés
 */

import { eq, and, asc, desc, max } from 'drizzle-orm';
import db from '../index';
import {
	aiProviders,
	aiProviderConfigs,
	aiProviderModels,
	type AiProvider,
	type AiProviderConfig,
	type AiProviderModel,
	type AiProviderInsert,
	type AiProviderConfigInsert
} from '@racona/database/schemas';

export interface ProviderWithConfigs extends AiProvider {
	configs: AiProviderConfig[];
}

export interface ProviderConfigMap {
	[key: string]: string;
}

/** Egy provider a választható modelljeivel (az AI asszisztens beállításaihoz) */
export interface ProviderWithModels {
	name: string;
	displayName: string;
	description: string | null;
	isRecommended: boolean;
	models: AiProviderModel[];
}

/**
 * Összes engedélyezett provider lekérése konfigurációkkal
 */
export async function getEnabledProviders(): Promise<ProviderWithConfigs[]> {
	const providers = await db
		.select()
		.from(aiProviders)
		.where(eq(aiProviders.isEnabled, true))
		.orderBy(aiProviders.isRecommended, aiProviders.displayName);

	const providersWithConfigs: ProviderWithConfigs[] = [];

	for (const provider of providers) {
		const configs = await db
			.select()
			.from(aiProviderConfigs)
			.where(eq(aiProviderConfigs.providerId, provider.id));

		providersWithConfigs.push({
			...provider,
			configs
		});
	}

	return providersWithConfigs;
}

/**
 * Egy provider konfigurációjának lekérése kulcs-érték párokban
 */
export async function getProviderConfigMap(providerName: string): Promise<ProviderConfigMap> {
	const provider = await db
		.select()
		.from(aiProviders)
		.where(and(eq(aiProviders.name, providerName), eq(aiProviders.isEnabled, true)))
		.limit(1);

	if (!provider[0]) {
		throw new Error(`Provider not found or disabled: ${providerName}`);
	}

	const configs = await db
		.select()
		.from(aiProviderConfigs)
		.where(eq(aiProviderConfigs.providerId, provider[0].id));

	const configMap: ProviderConfigMap = {};
	for (const config of configs) {
		configMap[config.configKey] = config.configValue;
	}

	return configMap;
}

/**
 * Provider név alapján provider adatok lekérése
 */
export async function getProviderByName(providerName: string): Promise<AiProvider | null> {
	const providers = await db
		.select()
		.from(aiProviders)
		.where(and(eq(aiProviders.name, providerName), eq(aiProviders.isEnabled, true)))
		.limit(1);

	return providers[0] || null;
}

/**
 * Új provider létrehozása
 */
export async function createProvider(data: AiProviderInsert): Promise<AiProvider> {
	const [provider] = await db.insert(aiProviders).values(data).returning();

	return provider;
}

/**
 * Provider konfiguráció hozzáadása
 */
export async function addProviderConfig(data: AiProviderConfigInsert): Promise<AiProviderConfig> {
	const [config] = await db.insert(aiProviderConfigs).values(data).returning();

	return config;
}

/**
 * Provider konfiguráció frissítése
 */
export async function updateProviderConfig(
	providerId: number,
	configKey: string,
	configValue: string
): Promise<void> {
	await db
		.update(aiProviderConfigs)
		.set({ configValue })
		.where(
			and(eq(aiProviderConfigs.providerId, providerId), eq(aiProviderConfigs.configKey, configKey))
		);
}

// ============================================================================
// Modellek
// ============================================================================

/**
 * Az engedélyezett providerek az összes (letiltott is) modelljükkel, sorrendben
 */
export async function getProvidersWithModels(): Promise<ProviderWithModels[]> {
	const providers = await db
		.select()
		.from(aiProviders)
		.where(eq(aiProviders.isEnabled, true))
		.orderBy(desc(aiProviders.isRecommended), asc(aiProviders.displayName));

	const models = await db
		.select()
		.from(aiProviderModels)
		.orderBy(asc(aiProviderModels.sortOrder), asc(aiProviderModels.displayName));

	return providers.map((provider) => ({
		name: provider.name,
		displayName: provider.displayName,
		description: provider.description,
		isRecommended: provider.isRecommended,
		models: models.filter((model) => model.providerId === provider.id)
	}));
}

/**
 * Egy provider alapértelmezett (engedélyezett) modellje, ha van
 */
export async function getDefaultModel(providerName: string): Promise<string | null> {
	const [row] = await db
		.select({ modelId: aiProviderModels.modelId })
		.from(aiProviderModels)
		.innerJoin(aiProviders, eq(aiProviders.id, aiProviderModels.providerId))
		.where(
			and(
				eq(aiProviders.name, providerName),
				eq(aiProviderModels.isDefault, true),
				eq(aiProviderModels.isEnabled, true)
			)
		)
		.limit(1);

	return row?.modelId ?? null;
}

/**
 * Új modell felvétele egy providerhez (a lista végére)
 */
export async function addModel(
	providerName: string,
	modelId: string,
	displayName: string
): Promise<AiProviderModel> {
	const provider = await getProviderByName(providerName);
	if (!provider) {
		throw new Error(`Provider not found or disabled: ${providerName}`);
	}

	const [{ maxOrder }] = await db
		.select({ maxOrder: max(aiProviderModels.sortOrder) })
		.from(aiProviderModels)
		.where(eq(aiProviderModels.providerId, provider.id));

	const [model] = await db
		.insert(aiProviderModels)
		.values({
			providerId: provider.id,
			modelId,
			displayName,
			sortOrder: (maxOrder ?? 0) + 10
		})
		.returning();

	return model;
}

/**
 * Modell nevének vagy engedélyezésének módosítása. Letiltott modell nem lehet alapértelmezett.
 */
export async function updateModel(
	id: number,
	data: { displayName?: string; isEnabled?: boolean }
): Promise<AiProviderModel | null> {
	const [model] = await db
		.update(aiProviderModels)
		.set({
			...data,
			...(data.isEnabled === false ? { isDefault: false } : {}),
			updatedAt: new Date()
		})
		.where(eq(aiProviderModels.id, id))
		.returning();

	return model ?? null;
}

/**
 * Modell beállítása a provider alapértelmezettjének (a többiről lekerül a jelölés)
 */
export async function setDefaultModel(id: number): Promise<AiProviderModel | null> {
	return db.transaction(async (tx) => {
		const [model] = await tx.select().from(aiProviderModels).where(eq(aiProviderModels.id, id));
		if (!model) return null;

		await tx
			.update(aiProviderModels)
			.set({ isDefault: false, updatedAt: new Date() })
			.where(eq(aiProviderModels.providerId, model.providerId));

		const [updated] = await tx
			.update(aiProviderModels)
			.set({ isDefault: true, isEnabled: true, updatedAt: new Date() })
			.where(eq(aiProviderModels.id, id))
			.returning();

		return updated;
	});
}

/**
 * Admin által felvett modell törlése. A beépített modellek nem törölhetők (csak letilthatók),
 * mert a seed újrafuttatáskor visszahozná őket.
 */
export async function deleteModel(id: number): Promise<'deleted' | 'not_found' | 'builtin'> {
	const [model] = await db.select().from(aiProviderModels).where(eq(aiProviderModels.id, id));
	if (!model) return 'not_found';
	if (model.isBuiltin) return 'builtin';

	await db.delete(aiProviderModels).where(eq(aiProviderModels.id, id));
	return 'deleted';
}

export const aiProviderRepository = {
	getEnabledProviders,
	getProvidersWithModels,
	getDefaultModel,
	addModel,
	updateModel,
	setDefaultModel,
	deleteModel,
	getProviderConfigMap,
	getProviderByName,
	createProvider,
	addProviderConfig,
	updateProviderConfig
};
