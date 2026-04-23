/**
 * Admin Config Remote Actions
 *
 * Admin-szintű külső szolgáltatások konfigurációja (AI Assistant, TTS Provider)
 * Requirements: 2.7, 2.8, 3.6, 3.7, 3.8, 3.9, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { adminConfigRepository, permissionRepository } from '$lib/server/database/repositories';
import { encrypt, decrypt, maskApiKey } from '$lib/server/utils/encryption';
import type { AIAssistantConfig } from '@racona/database/schemas';

// ============================================================================
// Validation Schemas
// ============================================================================

const getAdminConfigSchema = v.object({
	configKey: v.pipe(v.string(), v.minLength(1, 'Config key is required'))
});

const updateAIAssistantConfigSchema = v.object({
	enabled: v.optional(v.boolean()), // AI Agent globális engedélyezése/letiltása
	aiAgent: v.object({
		provider: v.pipe(v.string(), v.minLength(1, 'Provider is required')),
		apiKey: v.pipe(v.string(), v.minLength(1, 'API key is required')),
		model: v.pipe(v.string(), v.minLength(1, 'Model is required')),
		baseUrl: v.optional(v.string()),
		advancedParams: v.object({
			maxTokens: v.pipe(v.number(), v.minValue(1), v.maxValue(100000)),
			temperature: v.pipe(v.number(), v.minValue(0), v.maxValue(2)),
			topP: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))
		})
	}),
	ttsProvider: v.object({
		enabled: v.optional(v.boolean()), // TTS globális engedélyezése/letiltása
		provider: v.pipe(v.string(), v.minLength(1, 'Provider is required')),
		apiKey: v.optional(v.string()),
		voiceId: v.optional(v.string()),
		language: v.optional(v.string())
	})
});

const deleteAIAssistantConfigSchema = v.object({
	configKey: v.pipe(v.string(), v.minLength(1, 'Config key is required'))
});

const testAIAgentConnectionSchema = v.object({
	provider: v.pipe(v.string(), v.minLength(1, 'Provider is required')),
	apiKey: v.pipe(v.string(), v.minLength(1, 'API key is required')),
	model: v.pipe(v.string(), v.minLength(1, 'Model is required')),
	baseUrl: v.optional(v.string())
});

const testTTSProviderConnectionSchema = v.object({
	provider: v.pipe(v.string(), v.minLength(1, 'Provider is required')),
	apiKey: v.optional(v.string()),
	voiceId: v.optional(v.string())
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ellenőrzi, hogy a felhasználónak van-e admin external services jogosultsága
 */
async function checkAdminPermission(): Promise<{ hasPermission: boolean; userId: number | null }> {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { hasPermission: false, userId: null };
	}

	const userId = parseInt(locals.user.id);

	try {
		const permissions = await permissionRepository.findPermissionsForUser(userId);
		const hasPermission = permissions.includes('settings.admin.aiAssistant');

		return { hasPermission, userId };
	} catch (error) {
		console.error('Error checking admin permission:', error);
		return { hasPermission: false, userId };
	}
}

/**
 * AI Agent API key validálása formátum alapján
 */
function validateAIAgentApiKey(
	provider: string,
	apiKey: string
): { valid: boolean; error?: string } {
	if (provider === 'openai' && !apiKey.startsWith('sk-')) {
		return { valid: false, error: 'OpenAI API key must start with "sk-"' };
	}
	if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
		return { valid: false, error: 'Anthropic API key must start with "sk-ant-"' };
	}
	// További provider-specifikus validációk...
	return { valid: true };
}

// ============================================================================
// 3.1 Admin Config CRUD Routes
// ============================================================================

/**
 * Admin konfiguráció lekérése config_key alapján
 * Requirements: 6.1, 6.2, 7.1
 */
export const getAdminConfig = command(
	getAdminConfigSchema,
	async ({ configKey }): Promise<{ success: boolean; config?: any; error?: string }> => {
		const { hasPermission, userId } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			const config = await adminConfigRepository.getByConfigKey(configKey);

			if (!config) {
				return { success: false, error: 'Configuration not found' };
			}

			return { success: true, config };
		} catch (error) {
			console.error('Error fetching admin config:', error);
			return { success: false, error: 'Failed to fetch configuration' };
		}
	}
);

/**
 * AI Assistant konfiguráció lekérése (maszkolt API key-ekkel)
 * Requirements: 2.7, 6.1, 6.2, 7.1, 7.3
 */
const emptySchema = v.object({});

export const getAIAssistantConfig = command(
	emptySchema,
	async (): Promise<{ success: boolean; config?: AIAssistantConfig; error?: string }> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			const config = await adminConfigRepository.getByConfigKey('ai_assistant');

			if (!config) {
				return { success: false, error: 'AI Assistant configuration not found' };
			}

			const configData = config.configData as AIAssistantConfig;

			// Maszkoljuk az API key-eket
			const maskedConfig: AIAssistantConfig = {
				enabled: configData.enabled ?? true, // Alapértelmezetten engedélyezett
				aiAgent: {
					...configData.aiAgent,
					apiKeyEncrypted: maskApiKey(await decrypt(configData.aiAgent.apiKeyEncrypted))
				},
				ttsProvider: {
					...configData.ttsProvider,
					apiKeyEncrypted: configData.ttsProvider.apiKeyEncrypted
						? maskApiKey(await decrypt(configData.ttsProvider.apiKeyEncrypted))
						: undefined
				}
			};

			return { success: true, config: maskedConfig };
		} catch (error) {
			console.error('Error fetching AI Assistant config:', error);
			return { success: false, error: 'Failed to fetch AI Assistant configuration' };
		}
	}
);

/**
 * AI Agent engedélyezettségi státusz lekérése (publikus, nem igényel admin jogot)
 * Ez a függvény gyorsan ellenőrzi, hogy az AI Agent engedélyezve van-e
 */
export const isAIAgentEnabled = command(
	emptySchema,
	async (): Promise<{ enabled: boolean; configured: boolean }> => {
		try {
			const config = await adminConfigRepository.getByConfigKey('ai_assistant');

			if (!config) {
				return { enabled: false, configured: false };
			}

			const configData = config.configData as AIAssistantConfig;
			const enabled = configData.enabled ?? true; // Alapértelmezetten engedélyezett
			const configured = !!(
				configData.aiAgent?.apiKeyEncrypted &&
				configData.aiAgent?.model &&
				configData.aiAgent?.provider
			);

			return { enabled, configured };
		} catch (error) {
			console.error('Error checking AI Agent status:', error);
			return { enabled: false, configured: false };
		}
	}
);

/**
 * TTS Provider engedélyezettségi státusz lekérése (publikus, nem igényel admin jogot)
 * Ez a függvény gyorsan ellenőrzi, hogy a TTS Provider engedélyezve van-e
 */
export const isTTSProviderEnabled = command(
	emptySchema,
	async (): Promise<{ enabled: boolean; configured: boolean }> => {
		try {
			const config = await adminConfigRepository.getByConfigKey('ai_assistant');

			if (!config) {
				return { enabled: false, configured: false };
			}

			const configData = config.configData as AIAssistantConfig;
			const enabled = configData.ttsProvider?.enabled ?? true; // Alapértelmezetten engedélyezett
			const configured = !!configData.ttsProvider?.provider;

			return { enabled, configured };
		} catch (error) {
			console.error('Error checking TTS Provider status:', error);
			return { enabled: false, configured: false };
		}
	}
);

/**
 * AI Assistant konfiguráció frissítése (titkosítással)
 * Requirements: 2.7, 2.8, 3.6, 6.3, 6.4, 6.5, 7.2, 7.5, 8.1, 8.2
 */
export const updateAIAssistantConfig = command(
	updateAIAssistantConfigSchema,
	async (data): Promise<{ success: boolean; error?: string }> => {
		const { hasPermission, userId } = await checkAdminPermission();

		if (!hasPermission || !userId) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			let aiApiKey = data.aiAgent.apiKey;
			let ttsApiKey = data.ttsProvider.apiKey;

			// Ha az AI Agent API kulcs maszkolt, akkor az adatbázisból töltjük be
			if (aiApiKey.includes('*')) {
				const existingConfig = await adminConfigRepository.getByConfigKey('ai_assistant');
				if (existingConfig) {
					const existingData = existingConfig.configData as AIAssistantConfig;
					// Használjuk a már titkosított kulcsot
					aiApiKey = existingData.aiAgent.apiKeyEncrypted;
				} else {
					return {
						success: false,
						error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
					};
				}
			} else {
				// Csak akkor validáljuk, ha nem maszkolt
				const aiKeyValidation = validateAIAgentApiKey(data.aiAgent.provider, aiApiKey);
				if (!aiKeyValidation.valid) {
					return { success: false, error: aiKeyValidation.error };
				}
				// Titkosítjuk az új kulcsot
				aiApiKey = await encrypt(aiApiKey);
			}

			// Ha a TTS API kulcs maszkolt, akkor az adatbázisból töltjük be
			let encryptedTTSKey: string | undefined;
			if (ttsApiKey && ttsApiKey.includes('*')) {
				const existingConfig = await adminConfigRepository.getByConfigKey('ai_assistant');
				if (existingConfig) {
					const existingData = existingConfig.configData as AIAssistantConfig;
					encryptedTTSKey = existingData.ttsProvider.apiKeyEncrypted;
				}
			} else if (ttsApiKey) {
				// Titkosítjuk az új kulcsot
				encryptedTTSKey = await encrypt(ttsApiKey);
			}

			// Konfiguráció objektum összeállítása
			const configData: AIAssistantConfig = {
				enabled: data.enabled ?? true, // Alapértelmezetten engedélyezett
				aiAgent: {
					provider: data.aiAgent.provider,
					apiKeyEncrypted: aiApiKey,
					model: data.aiAgent.model,
					baseUrl: data.aiAgent.baseUrl,
					advancedParams: {
						maxTokens: data.aiAgent.advancedParams.maxTokens,
						temperature: data.aiAgent.advancedParams.temperature,
						topP: data.aiAgent.advancedParams.topP
					}
				},
				ttsProvider: {
					enabled: data.ttsProvider.enabled ?? true, // Alapértelmezetten engedélyezett
					provider: data.ttsProvider.provider,
					apiKeyEncrypted: encryptedTTSKey,
					voiceId: data.ttsProvider.voiceId,
					language: data.ttsProvider.language
				}
			};

			// Mentés az adatbázisba
			await adminConfigRepository.upsert('ai_assistant', configData, userId);

			return { success: true };
		} catch (error) {
			console.error('Error updating AI Assistant config:', error);
			return { success: false, error: 'Failed to update AI Assistant configuration' };
		}
	}
);

/**
 * AI Assistant konfiguráció törlése
 * Requirements: 6.3, 7.2
 */
export const deleteAIAssistantConfig = command(
	deleteAIAssistantConfigSchema,
	async ({ configKey }): Promise<{ success: boolean; error?: string }> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			const deleted = await adminConfigRepository.delete(configKey);

			if (!deleted) {
				return { success: false, error: 'Configuration not found' };
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting admin config:', error);
			return { success: false, error: 'Failed to delete configuration' };
		}
	}
);

// ============================================================================
// 3.2 Connection Testing Routes
// ============================================================================

/**
 * AI Agent kapcsolat tesztelése
 * Requirements: 2.8, 8.3, 8.4
 */
export const testAIAgentConnection = command(
	testAIAgentConnectionSchema,
	async (data): Promise<{ success: boolean; message?: string; error?: string }> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			let { apiKey, provider, model, baseUrl } = data;

			// Ha az API kulcs maszkolt (tartalmaz csillagokat), akkor az adatbázisból töltjük be
			if (apiKey.includes('*')) {
				const config = await adminConfigRepository.getByConfigKey('ai_assistant');
				if (!config) {
					return {
						success: false,
						error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
					};
				}

				const configData = config.configData as AIAssistantConfig;
				// Visszafejtjük az API key-t
				apiKey = await decrypt(configData.aiAgent.apiKeyEncrypted);
				// Használjuk a mentett konfigurációt, ha nem adtak meg mást
				provider = provider || configData.aiAgent.provider;
				model = model || configData.aiAgent.model;
				baseUrl = baseUrl || configData.aiAgent.baseUrl;
			}

			// Validáljuk az API key formátumát
			const validation = validateAIAgentApiKey(provider, apiKey);
			if (!validation.valid) {
				return { success: false, error: validation.error };
			}

			// Provider-specifikus kapcsolat tesztelés
			if (provider === 'openai') {
				const response = await fetch(`${baseUrl || 'https://api.openai.com/v1'}/models/${model}`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: `OpenAI API error: ${errorData.error?.message || response.statusText}`
					};
				}

				return { success: true, message: 'Connection successful' };
			} else if (provider === 'anthropic') {
				// Anthropic API test
				const response = await fetch('https://api.anthropic.com/v1/messages', {
					method: 'POST',
					headers: {
						'x-api-key': apiKey,
						'anthropic-version': '2023-06-01',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						model: model,
						max_tokens: 10,
						messages: [{ role: 'user', content: 'test' }]
					})
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: `Anthropic API error: ${errorData.error?.message || response.statusText}`
					};
				}

				return { success: true, message: 'Connection successful' };
			} else if (provider === 'gemini') {
				// Google Gemini API test
				const response = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`,
					{
						method: 'GET'
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: `Gemini API error: ${errorData.error?.message || response.statusText}`
					};
				}

				return { success: true, message: 'Connection successful' };
			}

			return { success: false, error: `Unsupported provider: ${provider}` };
		} catch (error) {
			console.error('Error testing AI Agent connection:', error);
			return {
				success: false,
				error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
);

/**
 * TTS Provider kapcsolat tesztelése
 * Requirements: 3.8, 8.3, 8.4
 */
export const testTTSProviderConnection = command(
	testTTSProviderConnectionSchema,
	async (data): Promise<{ success: boolean; message?: string; error?: string }> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			let { apiKey, provider } = data;

			// Ha az API kulcs maszkolt (tartalmaz csillagokat), akkor az adatbázisból töltjük be
			if (apiKey && apiKey.includes('*')) {
				const config = await adminConfigRepository.getByConfigKey('ai_assistant');
				if (!config) {
					return {
						success: false,
						error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
					};
				}

				const configData = config.configData as AIAssistantConfig;
				// Visszafejtjük az API key-t, ha van
				if (configData.ttsProvider.apiKeyEncrypted) {
					apiKey = await decrypt(configData.ttsProvider.apiKeyEncrypted);
				}
				// Használjuk a mentett provider-t, ha nem adtak meg mást
				provider = provider || configData.ttsProvider.provider;
			}

			if (provider === 'browser') {
				// Browser Web Speech API nem igényel API key-t
				return { success: true, message: 'Browser Web Speech API is available' };
			} else if (provider === 'elevenlabs') {
				if (!apiKey) {
					return { success: false, error: 'API key is required for ElevenLabs' };
				}

				// ElevenLabs API test - voices lekérése
				const response = await fetch('https://api.elevenlabs.io/v1/voices', {
					method: 'GET',
					headers: {
						'xi-api-key': apiKey
					}
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: `ElevenLabs API error: ${errorData.detail?.message || response.statusText}`
					};
				}

				const voicesData = await response.json();
				return {
					success: true,
					message: `Connection successful. Found ${voicesData.voices?.length || 0} voices.`
				};
			}

			return { success: false, error: `Unsupported provider: ${provider}` };
		} catch (error) {
			console.error('Error testing TTS Provider connection:', error);
			return {
				success: false,
				error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
);

/**
 * ElevenLabs hangok betöltése
 * Requirements: 3.8
 */
export const loadElevenLabsVoices = command(
	v.object({}),
	async (): Promise<{
		success: boolean;
		voices?: Array<{ id: string; name: string }>;
		error?: string;
	}> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			// Betöltjük a mentett konfigurációt
			const config = await adminConfigRepository.getByConfigKey('ai_assistant');
			if (!config) {
				return {
					success: false,
					error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
				};
			}

			const configData = config.configData as AIAssistantConfig;
			if (configData.ttsProvider.provider !== 'elevenlabs') {
				return {
					success: false,
					error: 'A mentett konfiguráció nem ElevenLabs provider-t használ.'
				};
			}

			if (!configData.ttsProvider.apiKeyEncrypted) {
				return {
					success: false,
					error: 'Nincs mentett API kulcs.'
				};
			}

			// Visszafejtjük az API kulcsot
			const apiKey = await decrypt(configData.ttsProvider.apiKeyEncrypted);

			// Lekérjük a hangokat
			const response = await fetch('https://api.elevenlabs.io/v1/voices', {
				method: 'GET',
				headers: {
					'xi-api-key': apiKey
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: `ElevenLabs API error: ${errorData.detail?.message || response.statusText}`
				};
			}

			const data = await response.json();
			const voices = data.voices
				// Csak a premade és generated hangokat, library hangok fizetősek az API-n
				.filter((v: any) => v.category === 'premade' || v.category === 'generated')
				.map((v: any) => ({
					id: v.voice_id,
					name: v.name
				}));

			return { success: true, voices };
		} catch (error) {
			console.error('Error loading ElevenLabs voices:', error);
			return {
				success: false,
				error: `Failed to load voices: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
);

/**
 * ElevenLabs teszt hang generálása
 * Requirements: 3.8
 */
export const testElevenLabsVoice = command(
	v.object({
		voiceId: v.pipe(v.string(), v.minLength(1, 'Voice ID is required')),
		text: v.optional(v.string())
	}),
	async (
		data
	): Promise<{
		success: boolean;
		audioUrl?: string;
		error?: string;
	}> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			// Betöltjük a mentett konfigurációt
			const config = await adminConfigRepository.getByConfigKey('ai_assistant');
			if (!config) {
				return {
					success: false,
					error: 'Nincs mentett konfiguráció. Kérlek, mentsd el először a beállításokat.'
				};
			}

			const configData = config.configData as AIAssistantConfig;
			if (configData.ttsProvider.provider !== 'elevenlabs') {
				return {
					success: false,
					error: 'A mentett konfiguráció nem ElevenLabs provider-t használ.'
				};
			}

			if (!configData.ttsProvider.apiKeyEncrypted) {
				return {
					success: false,
					error: 'Nincs mentett API kulcs.'
				};
			}

			// Visszafejtjük az API kulcsot
			const apiKey = await decrypt(configData.ttsProvider.apiKeyEncrypted);

			// Generáljuk a hangot
			const testText = data.text || 'This is a test voice.';
			const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${data.voiceId}`, {
				method: 'POST',
				headers: {
					Accept: 'audio/mpeg',
					'Content-Type': 'application/json',
					'xi-api-key': apiKey
				},
				body: JSON.stringify({
					text: testText,
					model_id: 'eleven_multilingual_v2',
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75,
						style: 0.0,
						use_speaker_boost: true
					}
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: `ElevenLabs API error: ${errorData.detail?.message || response.statusText}`
				};
			}

			// Visszaadjuk az audio blob-ot base64-ben
			const audioBuffer = await response.arrayBuffer();
			const base64Audio = Buffer.from(audioBuffer).toString('base64');
			const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

			return { success: true, audioUrl };
		} catch (error) {
			console.error('Error testing ElevenLabs voice:', error);
			return {
				success: false,
				error: `Failed to test voice: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
);

// ============================================================================
// Avatar Management
// ============================================================================

/**
 * Telepített avatarok listázása (settings app számára)
 */
export const listAvatarsForSettings = command(
	emptySchema,
	async (): Promise<{
		success: boolean;
		avatars: Array<{
			idname: string;
			displayName: string;
			availableQualities: Array<'sd' | 'hd'>;
		}>;
		error?: string;
	}> => {
		const { hasPermission } = await checkAdminPermission();

		if (!hasPermission) {
			return {
				success: false,
				avatars: [],
				error: 'Unauthorized: settings.admin.aiAssistant permission required'
			};
		}

		try {
			const { avatarRepository } = await import('$lib/server/database/repositories');
			const avatars = await avatarRepository.listAvatars();

			return { success: true, avatars };
		} catch (error) {
			console.error('Error listing avatars:', error);
			return {
				success: false,
				avatars: [],
				error: `Failed to list avatars: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
);
