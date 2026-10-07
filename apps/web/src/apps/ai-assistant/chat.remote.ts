/**
 * AI Chat Remote Actions
 *
 * AI Agent chat funkció - server-side actions.
 *
 * A rendszer automatikusan beállítja az AI válaszok nyelvét a felhasználó
 * WebOS nyelvi beállítása alapján (locals.locale).
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import {
	avatarRepository,
	aiProviderRepository,
	adminConfigRepository,
	appRepository
} from '$lib/server/database/repositories';
import { getKnowledgeBase } from '$lib/server/ai-assistant/knowledgeBaseService.js';
import { buildKnowledgeContext, buildSystemPrompt } from '$lib/server/ai-assistant/prompts.js';
import { callChatProvider, PROVIDER_DEFAULTS } from '$lib/server/ai-assistant/providers.js';
import { CORE_SOURCE } from '$lib/server/ai-assistant/types.js';
import type {
	KnowledgeBaseLocale,
	PluginKnowledgeInfo,
	SearchResponse
} from '$lib/server/ai-assistant/types.js';
import { dev } from '$app/environment';
import { decrypt } from '$lib/server/utils/encryption';
import type { AIAssistantConfig } from '@racona/database/schemas';

// ============================================================================
// Helper funkciók
// ============================================================================

/**
 * APP jelölés kinyerése a válaszból
 * Formátum: [APP:appName] vagy [APP:appName:section]
 */
function extractAppSuggestion(text: string): {
	cleanText: string;
	suggestedApp?: { appName: string; section?: string };
} {
	const appRegex = /\[APP:([a-z0-9-]+)(?::([a-z0-9/-]+))?\]/i;
	const match = text.match(appRegex);

	if (match) {
		const cleanText = text.replace(appRegex, '').trim();
		const suggestedApp = {
			appName: match[1],
			section: match[2] || undefined
		};
		return { cleanText, suggestedApp };
	}

	return { cleanText: text };
}

/**
 * Modell és endpoint feloldása.
 * Modell: admin konfiguráció → a modellista alapértelmezettje → provider config → environment
 * változó → beépített alapérték. Endpoint: admin konfiguráció → provider config → beépített.
 */
async function resolveProviderTarget(
	provider: string,
	configModel: string | undefined,
	configBaseUrl: string | undefined
): Promise<{ model: string; url?: string }> {
	const defaults = PROVIDER_DEFAULTS[provider];

	let dbConfig: Record<string, string> = {};
	if (!configModel || !configBaseUrl) {
		try {
			dbConfig = await aiProviderRepository.getProviderConfigMap(provider);
		} catch (err) {
			console.error(`[AiChat] Provider config lekérési hiba (${provider}):`, err);
		}
	}

	let defaultModel: string | null = null;
	if (!configModel) {
		try {
			defaultModel = await aiProviderRepository.getDefaultModel(provider);
		} catch (err) {
			console.error(`[AiChat] Alapértelmezett modell lekérési hiba (${provider}):`, err);
		}
	}

	const model =
		configModel ||
		defaultModel ||
		dbConfig.default_model ||
		(defaults && process.env[defaults.modelEnvKey]) ||
		defaults?.model ||
		'';

	// Hugging Face-nél az URL a modell nevét is tartalmazza
	if (provider === 'huggingface' && !configBaseUrl) {
		return { model, url: `${defaults.url}/${model}` };
	}

	return { model, url: configBaseUrl || dbConfig.base_url || defaults?.url };
}

/**
 * A felhasználó számára elérhető pluginok, amelyeknek van tudásbázisa.
 * A hozzáférést ugyanaz dönti el, mint az alkalmazáslistát (szerepkör, csoport,
 * nyilvános app, aktív állapot). Hiba esetén csak a core tudásbázis marad.
 */
async function getAccessiblePluginKnowledge(
	userId: number,
	locale: KnowledgeBaseLocale
): Promise<PluginKnowledgeInfo[]> {
	try {
		const kb = getKnowledgeBase();
		await kb.initialize();
		const plugins = kb.getPlugins();
		if (plugins.length === 0) return [];

		const accessible = new Set(
			(await appRepository.findAppsForUser(userId, locale)).map((app) => app.appId)
		);
		return plugins.filter((plugin) => accessible.has(plugin.id));
	} catch (err) {
		console.warn('[AiChat] Plugin tudásbázisok lekérési hiba:', err);
		return [];
	}
}

/**
 * Tudásbázis keresés — hiba esetén üres eredménnyel folytatjuk
 */
async function searchKnowledgeBase(
	query: string,
	locale: KnowledgeBaseLocale,
	sources: string[]
): Promise<SearchResponse | null> {
	try {
		return await getKnowledgeBase().search({
			query,
			userLocale: locale,
			maxResults: 5,
			enableFallback: true,
			sources
		});
	} catch (err) {
		console.warn('[AiChat] Knowledge Base keresési hiba:', err);
		return null;
	}
}

// ============================================================================
// Sémák
// ============================================================================

/** sendChatMessage: üzenet küldése az AI agentnek */
const sendChatMessageSchema = v.object({
	message: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
	conversationHistory: v.optional(
		v.array(
			v.object({
				role: v.union([v.literal('user'), v.literal('assistant')]),
				content: v.string()
			})
		)
	)
});

// ============================================================================
// Válasz típusok
// ============================================================================

export interface SendChatMessageResult {
	success: boolean;
	error?: string;
	response?: string;
	suggestedApp?: {
		appName: string;
		section?: string;
	};
}

export interface GetWelcomeMessageResult {
	success: boolean;
	error?: string;
	message?: string;
}

// ============================================================================
// sendChatMessage — üzenet küldése az AI agentnek
// ============================================================================

export const sendChatMessage = command(
	sendChatMessageSchema,
	async (data): Promise<SendChatMessageResult> => {
		const { locals } = getRequestEvent();

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			// Betöltjük a globális admin AI Agent konfigurációt
			const adminConfig = await adminConfigRepository.getByConfigKey('ai_assistant');
			if (!adminConfig || !adminConfig.configData) {
				return {
					success: false,
					error:
						'Nincs beállított AI agent konfiguráció. Kérlek, állítsd be először a beállításokban.'
				};
			}

			const aiConfig = adminConfig.configData as AIAssistantConfig;

			// Ellenőrizzük, hogy az AI Agent engedélyezve van-e
			if (!aiConfig.enabled) {
				return {
					success: false,
					error: 'Az AI Agent funkció jelenleg le van tiltva.'
				};
			}

			// API kulcs dekódolása
			const apiKey = await decrypt(aiConfig.aiAgent.apiKeyEncrypted);
			if (!apiKey) {
				return {
					success: false,
					error: 'Az API kulcs dekódolása sikertelen.'
				};
			}

			const provider = aiConfig.aiAgent.provider;
			const { model, url } = await resolveProviderTarget(
				provider,
				aiConfig.aiAgent.model,
				aiConfig.aiAgent.baseUrl
			);
			if (!url) {
				return {
					success: false,
					error: 'Egyéni endpoint esetén az alap URL megadása kötelező'
				};
			}

			// Nyelvi beállítás meghatározása
			const locale: KnowledgeBaseLocale = (locals.locale || 'hu') === 'hu' ? 'hu' : 'en';

			// Knowledge Base keresés (core + a felhasználó számára elérhető pluginok)
			// és kontextus a felhasználó üzenetéhez
			const plugins = await getAccessiblePluginKnowledge(parseInt(locals.user.id), locale);
			const searchResponse = await searchKnowledgeBase(data.message, locale, [
				CORE_SOURCE,
				...plugins.map((plugin) => plugin.id)
			]);
			const knowledgeContext = buildKnowledgeContext(searchResponse?.results ?? [], locale);

			const result = await callChatProvider({
				provider,
				apiKey,
				model,
				url,
				params: {
					maxTokens: aiConfig.aiAgent.advancedParams.maxTokens ?? 1000,
					temperature: aiConfig.aiAgent.advancedParams.temperature ?? 0.7,
					topP: aiConfig.aiAgent.advancedParams.topP ?? 0.9
				},
				system: buildSystemPrompt(locale, plugins),
				history: data.conversationHistory ?? [],
				userMessage: data.message + knowledgeContext
			});

			if (!result.success) {
				return { success: false, error: result.error };
			}

			// APP jelölés kinyerése
			const { cleanText, suggestedApp } = extractAppSuggestion(result.text);

			// Fejlesztéskor a keresési találatok száma a válasz végén
			const debugInfo =
				dev && searchResponse && searchResponse.totalResults > 0
					? `\n\n(Debug: ${searchResponse.primaryLanguageResults} találat ${locale} nyelven, ${searchResponse.fallbackLanguageResults} fallback; ${searchResponse.results.map((r) => r.chunk.documentPath).join(', ')})`
					: '';

			return {
				success: true,
				response: cleanText + debugInfo,
				suggestedApp
			};
		} catch (err) {
			console.error('[AiChat] Hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);

// ============================================================================
// getWelcomeMessage — üdvözlő üzenet generálása avatar névvel
// ============================================================================

export const getWelcomeMessage = command(
	v.object({}),
	async (): Promise<GetWelcomeMessageResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const userId = parseInt(locals.user.id);

			// Avatar konfiguráció lekérése
			const avatarConfig = await avatarRepository.getUserAvatarConfig(userId);

			// Avatar név meghatározása
			let avatarName = 'AI Asszisztens';
			if (avatarConfig?.customName) {
				avatarName = avatarConfig.customName;
			} else if (avatarConfig?.avatarIdname) {
				// Ha nincs custom név, de van avatar, akkor az avatar display name-t használjuk
				const avatar = await avatarRepository.findAvatarByIdname(avatarConfig.avatarIdname);
				if (avatar) {
					avatarName = avatar.displayName;
				}
			}

			// Nyelvi beállítás meghatározása
			const userLocale = locals.locale || 'hu';

			// Üdvözlő üzenet generálása
			let welcomeMessage: string;
			if (userLocale === 'hu') {
				welcomeMessage = `Szia! ${avatarName} vagyok. Miben segíthetek?`;
			} else {
				welcomeMessage = `Hello! I'm ${avatarName}. How can I help you?`;
			}

			return {
				success: true,
				message: welcomeMessage
			};
		} catch (err) {
			console.error('[AiChat] Üdvözlő üzenet hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);
