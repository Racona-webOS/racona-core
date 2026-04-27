/**
 * Agent Config Remote Actions
 *
 * AI Agent konfiguráció kezelése - server-side actions.
 *
 * Támogatott environment változók default model nevekhez:
 * - AI_GEMINI_DEFAULT_MODEL: Gemini provider default modelje
 * - AI_GROQ_DEFAULT_MODEL: Groq provider default modelje
 * - AI_OPENAI_DEFAULT_MODEL: OpenAI provider default modelje
 * - AI_ANTHROPIC_DEFAULT_MODEL: Anthropic provider default modelje
 * - AI_HUGGINGFACE_DEFAULT_MODEL: Hugging Face provider default modelje
 * - AI_CUSTOM_DEFAULT_MODEL: Custom provider default modelje
 *
 * Precedencia sorrend: manuális konfiguráció → environment változó → hardkódolt default
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { agentConfigRepository, aiProviderRepository } from '$lib/server/database/repositories';
import type { AgentConfigWithMaskedKey } from '$lib/server/database/repositories';

// ============================================================================
// Sémák
// ============================================================================

/** saveAgentConfig: agent konfiguráció mentése */
const saveAgentConfigSchema = v.object({
	provider: v.pipe(
		v.string(),
		v.minLength(1),
		v.union([
			v.literal('gemini'),
			v.literal('groq'),
			v.literal('openai'),
			v.literal('anthropic'),
			v.literal('huggingface'),
			v.literal('custom')
		])
	),
	apiKey: v.pipe(v.string(), v.minLength(1)),
	modelName: v.optional(v.nullable(v.string())),
	baseUrl: v.optional(v.nullable(v.string())),
	maxTokens: v.optional(v.nullable(v.pipe(v.number(), v.minValue(1), v.maxValue(100000)))),
	temperature: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^\d+\.\d{2}$/)))),
	topP: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^\d+\.\d{2}$/))))
});

/** testAgentConnection: agent kapcsolat tesztelése */
const testAgentConnectionSchema = v.object({
	provider: v.pipe(v.string(), v.minLength(1)),
	apiKey: v.pipe(v.string(), v.minLength(1)),
	modelName: v.optional(v.nullable(v.string())),
	baseUrl: v.optional(v.nullable(v.string()))
});

// ============================================================================
// Válasz típusok
// ============================================================================

export interface GetAgentConfigResult {
	success: boolean;
	error?: string;
	config: AgentConfigWithMaskedKey | null;
}

export interface GetAvailableProvidersResult {
	success: boolean;
	error?: string;
	providers?: Array<{
		name: string;
		displayName: string;
		description: string;
		isRecommended: boolean;
		configs: Record<string, string>;
	}>;
}

export interface SaveAgentConfigResult {
	success: boolean;
	error?: string;
	config?: AgentConfigWithMaskedKey;
}

export interface TestConnectionResult {
	success: boolean;
	error?: string;
	message?: string;
}

// ============================================================================
// Helper funkciók
// ============================================================================

/**
 * Provider konfiguráció lekérése adatbázisból environment változó fallback-kel
 */
async function getProviderConfigValue(
	providerName: string,
	configKey: string,
	envKey?: string
): Promise<string | null> {
	try {
		const configMap = await aiProviderRepository.getProviderConfigMap(providerName);
		const dbValue = configMap[configKey];

		// Precedencia: adatbázis érték → environment változó → null
		if (dbValue) {
			return dbValue;
		}

		if (envKey && process.env[envKey]) {
			return process.env[envKey] || null;
		}

		return null;
	} catch (err) {
		console.error(
			`[AgentConfig] Provider config lekérési hiba (${providerName}.${configKey}):`,
			err
		);
		// Ha adatbázis hiba van, próbáljuk az environment változót
		if (envKey && process.env[envKey]) {
			return process.env[envKey] || null;
		}
		return null;
	}
}

// ============================================================================
// getAvailableProviders — elérhető AI szolgáltatók lekérése
// ============================================================================

export const getAvailableProviders = command(
	v.object({}),
	async (): Promise<GetAvailableProvidersResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const providersWithConfigs = await aiProviderRepository.getEnabledProviders();

			const providers = providersWithConfigs.map((provider) => {
				const configs: Record<string, string> = {};
				for (const config of provider.configs) {
					configs[config.configKey] = config.configValue;
				}

				return {
					name: provider.name,
					displayName: provider.displayName,
					description: provider.description || '',
					isRecommended: provider.isRecommended,
					configs
				};
			});

			return { success: true, providers };
		} catch (err) {
			console.error('[AgentConfig] Provider lekérési hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);

// ============================================================================
// getAgentConfig — aktív agent konfiguráció lekérése
// ============================================================================

export const getAgentConfig = command(v.object({}), async (): Promise<GetAgentConfigResult> => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'Nem vagy bejelentkezve.', config: null };
	}

	try {
		const userId = parseInt(locals.user.id);
		const config = await agentConfigRepository.getActiveAgentConfig(userId);

		return { success: true, config };
	} catch (err) {
		console.error('[AgentConfig] Lekérési hiba:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.',
			config: null
		};
	}
});

// ============================================================================
// saveAgentConfig — agent konfiguráció mentése
// ============================================================================

export const saveAgentConfig = command(
	saveAgentConfigSchema,
	async (data): Promise<SaveAgentConfigResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const userId = parseInt(locals.user.id);

			// Mentjük a konfigurációt
			await agentConfigRepository.upsertAgentConfig(userId, {
				provider: data.provider,
				apiKey: data.apiKey,
				modelName: data.modelName ?? null,
				baseUrl: data.baseUrl ?? null,
				maxTokens: data.maxTokens ?? 1000,
				temperature: data.temperature ?? '0.70',
				topP: data.topP ?? '0.90'
			});

			// Lekérjük a mentett konfigurációt (maszkolt API key-vel)
			const config = await agentConfigRepository.getActiveAgentConfig(userId);

			return { success: true, config: config ?? undefined };
		} catch (err) {
			console.error('[AgentConfig] Mentési hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);

// ============================================================================
// testAgentConnection — agent kapcsolat tesztelése
// ============================================================================

export const testAgentConnection = command(
	testAgentConnectionSchema,
	async (data): Promise<TestConnectionResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const userId = parseInt(locals.user.id);
			let { provider, apiKey, modelName, baseUrl } = data;
			let maxTokens = 10; // Teszteléshez elég a 10
			let temperature = 0.7;
			let topP = 0.9;

			// Ha az API kulcs maszkolt (tartalmaz csillagokat), akkor az adatbázisból töltjük be
			if (apiKey.includes('*')) {
				const config = await agentConfigRepository.getActiveAgentConfigWithKey(userId);
				if (!config) {
					return {
						success: false,
						error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
					};
				}
				// Használjuk a mentett konfigurációt
				apiKey = config.apiKey;
				provider = config.provider;
				modelName = modelName || config.modelName || null;
				baseUrl = baseUrl || config.baseUrl || null;
				maxTokens = config.maxTokens ?? 10;
				temperature = parseFloat(config.temperature ?? '0.70');
			}

			// Provider-specifikus tesztelés
			switch (provider) {
				case 'gemini': {
					// Google Gemini API tesztelés
					const url =
						baseUrl ||
						(await getProviderConfigValue('gemini', 'base_url')) ||
						'https://generativelanguage.googleapis.com/v1beta/models';
					const model =
						modelName ||
						(await getProviderConfigValue('gemini', 'default_model', 'AI_GEMINI_DEFAULT_MODEL')) ||
						'gemini-2.5-flash';
					const testUrl = `${url}/${model}:generateContent?key=${apiKey}`;

					const response = await fetch(testUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: 'Hello' }] }],
							generationConfig: {
								maxOutputTokens: maxTokens,
								temperature: temperature,
								topP: topP
							}
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Gemini API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					return {
						success: true,
						message: 'Gemini API kapcsolat sikeresen tesztelve'
					};
				}

				case 'groq': {
					// Groq API tesztelés
					const url =
						baseUrl ||
						(await getProviderConfigValue('groq', 'base_url')) ||
						'https://api.groq.com/openai/v1/chat/completions';
					const model =
						modelName ||
						(await getProviderConfigValue('groq', 'default_model', 'AI_GROQ_DEFAULT_MODEL')) ||
						'llama-3.3-70b-versatile';

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model,
							messages: [{ role: 'user', content: 'Hello' }],
							max_tokens: maxTokens,
							temperature: temperature,
							top_p: topP
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Groq API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					return {
						success: true,
						message: 'Groq API kapcsolat sikeresen tesztelve'
					};
				}

				case 'openai': {
					// OpenAI API tesztelés
					const url =
						baseUrl ||
						(await getProviderConfigValue('openai', 'base_url')) ||
						'https://api.openai.com/v1/chat/completions';
					const model =
						modelName ||
						(await getProviderConfigValue('openai', 'default_model', 'AI_OPENAI_DEFAULT_MODEL')) ||
						'gpt-4o-mini';

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model,
							messages: [{ role: 'user', content: 'Hello' }],
							max_tokens: maxTokens,
							temperature: temperature,
							top_p: topP
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `OpenAI API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					return {
						success: true,
						message: 'OpenAI API kapcsolat sikeresen tesztelve'
					};
				}

				case 'anthropic': {
					// Anthropic (Claude) API tesztelés
					const url =
						baseUrl ||
						(await getProviderConfigValue('anthropic', 'base_url')) ||
						'https://api.anthropic.com/v1/messages';
					const model =
						modelName ||
						(await getProviderConfigValue(
							'anthropic',
							'default_model',
							'AI_ANTHROPIC_DEFAULT_MODEL'
						)) ||
						'claude-3-5-sonnet-20241022';

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': apiKey,
							'anthropic-version': '2023-06-01'
						},
						body: JSON.stringify({
							model,
							messages: [{ role: 'user', content: 'Hello' }],
							max_tokens: maxTokens,
							temperature: temperature
							// Megjegyzés: Anthropic API nem támogatja a temperature és top_p egyidejű használatát
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Anthropic API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					return {
						success: true,
						message: 'Anthropic API kapcsolat sikeresen tesztelve'
					};
				}

				case 'huggingface': {
					// Hugging Face API tesztelés
					const url =
						baseUrl ||
						(await getProviderConfigValue('huggingface', 'base_url')) ||
						'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
					const model =
						modelName ||
						(await getProviderConfigValue(
							'huggingface',
							'default_model',
							'AI_HUGGINGFACE_DEFAULT_MODEL'
						)) ||
						'mistralai/Mistral-7B-Instruct-v0.2';
					const testUrl = baseUrl ? url : `https://api-inference.huggingface.co/models/${model}`;

					const response = await fetch(testUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							inputs: 'Hello',
							parameters: {
								max_new_tokens: maxTokens,
								temperature: temperature,
								top_p: topP
							}
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Hugging Face API hiba: ${errorData.error || response.statusText}`
						};
					}

					return {
						success: true,
						message: 'Hugging Face API kapcsolat sikeresen tesztelve'
					};
				}

				case 'custom': {
					// Egyéni endpoint tesztelés
					if (!baseUrl) {
						return {
							success: false,
							error: 'Egyéni endpoint esetén az alap URL megadása kötelező'
						};
					}

					// Próbálkozás OpenAI-kompatibilis API-val
					const response = await fetch(baseUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model:
								modelName ||
								(await getProviderConfigValue(
									'custom',
									'default_model',
									'AI_CUSTOM_DEFAULT_MODEL'
								)) ||
								'default',
							messages: [{ role: 'user', content: 'Hello' }],
							max_tokens: maxTokens,
							temperature: temperature,
							top_p: topP
						})
					});

					if (!response.ok) {
						return {
							success: false,
							error: `Egyéni API hiba: ${response.statusText}`
						};
					}

					return {
						success: true,
						message: 'Egyéni API kapcsolat sikeresen tesztelve'
					};
				}

				default:
					return {
						success: false,
						error: 'Ismeretlen provider típus'
					};
			}
		} catch (err) {
			console.error('[AgentConfig] Tesztelési hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);
