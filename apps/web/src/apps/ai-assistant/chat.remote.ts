/**
 * AI Chat Remote Actions
 *
 * AI Agent chat funkció - server-side actions.
 *
 * A rendszer automatikusan beállítja az AI válaszok nyelvét a felhasználó
 * WebOS nyelvi beállítása alapján (locals.locale).
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import {
	agentConfigRepository,
	avatarRepository,
	aiProviderRepository
} from '$lib/server/database/repositories';
import { KnowledgeBaseService } from '$lib/server/ai-assistant/knowledgeBaseService.js';
import type { KnowledgeBaseLocale, SearchParams } from '$lib/server/ai-assistant/types.js';
import { join } from 'path';
import { dev } from '$app/environment';

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
		console.error(`[AiChat] Provider config lekérési hiba (${providerName}.${configKey}):`, err);
		// Ha adatbázis hiba van, próbáljuk az environment változót
		if (envKey && process.env[envKey]) {
			return process.env[envKey] || null;
		}
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
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const userId = parseInt(locals.user.id);

			// Betöltjük az aktív agent konfigurációt
			const config = await agentConfigRepository.getActiveAgentConfigWithKey(userId);
			if (!config) {
				return {
					success: false,
					error:
						'Nincs beállított AI agent konfiguráció. Kérlek, állítsd be először a beállításokban.'
				};
			}

			const { provider, apiKey, modelName, baseUrl } = config;

			// Nyelvi beállítás meghatározása
			const userLocale = locals.locale || 'hu';
			const knowledgeBaseLocale: KnowledgeBaseLocale = userLocale === 'hu' ? 'hu' : 'en';

			// Knowledge Base keresés
			let contextFromKnowledgeBase = '';
			let knowledgeBaseInfo = '';

			try {
				// Knowledge Base szolgáltatás inicializálása
				const knowledgeBasePath = dev
					? join(process.cwd(), 'static/knowledge-base')
					: join(process.cwd(), 'static/knowledge-base');

				// Singleton resetelése, hogy az új útvonallal jöjjön létre
				KnowledgeBaseService.resetInstance();
				const kbService = KnowledgeBaseService.getInstance(knowledgeBasePath);
				await kbService.initialize();

				// Keresés a Knowledge Base-ben
				const searchParams: SearchParams = {
					query: data.message,
					userLocale: knowledgeBaseLocale,
					maxResults: 5,
					enableFallback: true
				};

				const searchResponse = await kbService.search(searchParams);

				console.log('[AiChat] Knowledge Base keresési eredmény:', {
					query: data.message,
					totalResults: searchResponse.totalResults,
					primaryResults: searchResponse.primaryLanguageResults,
					fallbackResults: searchResponse.fallbackLanguageResults,
					strategy: searchResponse.searchStrategy,
					results: searchResponse.results.map((r) => ({
						title: r.chunk.documentTitle,
						score: r.score,
						keywords: r.matchedKeywords,
						content: r.chunk.content.substring(0, 100) + '...'
					}))
				});

				if (searchResponse.results.length > 0) {
					// Context összeállítása a talált dokumentumokból
					const contextChunks = searchResponse.results
						.map((result, index) => {
							const sourceInfo =
								result.chunk.locale === knowledgeBaseLocale
									? ''
									: ` (forrás: ${result.chunk.locale === 'hu' ? 'magyar' : 'angol'} dokumentáció)`;

							return `[${index + 1}] ${result.chunk.documentTitle}${sourceInfo}\n${result.chunk.content}`;
						})
						.join('\n\n---\n\n');

					contextFromKnowledgeBase = `\n\n=== RACONA DOKUMENTÁCIÓ ===\nA következő dokumentációs részletek PONTOSAN válaszolnak a kérdésedre. Használd KÖTELEZŐEN ezeket az információkat a válaszadáshoz:\n\n${contextChunks}\n\n=== DOKUMENTÁCIÓ VÉGE ===\n\nA fenti dokumentáció alapján adj KONKRÉT, RÉSZLETES választ a kérdésre!`;

					// Információ a keresési stratégiáról
					if (searchResponse.searchStrategy === 'primary-with-fallback') {
						knowledgeBaseInfo = `\n\n(Debug: ${searchResponse.primaryLanguageResults} találat ${knowledgeBaseLocale} nyelven, ${searchResponse.fallbackLanguageResults} találat fallback nyelven)`;
					} else {
						knowledgeBaseInfo = `\n\n(Debug: ${searchResponse.totalResults} találat ${knowledgeBaseLocale} nyelven)`;
					}
				}
			} catch (kbError) {
				console.warn('[AiChat] Knowledge Base keresési hiba:', kbError);
				// Folytatjuk Knowledge Base nélkül
			}

			// System prompt - Racona-specifikus instrukciók
			let systemPrompt: string;
			if (userLocale === 'hu') {
				systemPrompt = `Te a Racona webes operációs rendszer hivatalos AI asszisztense vagy.

A Racona egy modern, böngészőben futó webes operációs rendszer asztali környezettel, alkalmazásokkal, beállításokkal és plugin rendszerrel.

FONTOS SZABÁLYOK:
1. CSAK a Racona rendszerrel kapcsolatos kérdésekre válaszolj
2. MINDIG a mellékelt dokumentáció alapján válaszolj - ha dokumentáció van mellékelve, azt KÖTELEZŐ használni
3. Ha a kérdés NEM a Racona rendszerről szól, udvariasan mondd el, hogy csak Racona-specifikus kérdésekre tudsz válaszolni
4. Ha a dokumentációban NINCS válasz a kérdésre, mondd el őszintén, hogy erről nincs információd
5. NE találj ki információkat - csak azt mondd el, ami a dokumentációban van

VÁLASZ FORMÁZÁS - KRITIKUS FONTOSSÁGÚ:
- Válaszolj magyarul, természetes beszédstílusban, mintha egy barátnak magyaráznád
- TILOS markdown formázást használni: SOHA ne használj **, ##, ###, *, _, \`, stb. jeleket
- KÖTELEZŐ sortöréseket használni a bekezdések között
- Használj CSAK egyszerű szöveget
- Minden bekezdés után tegyél egy üres sort
- Felsorolásoknál használj egyszerű kötőjelet (-) vagy számokat (1., 2., 3.)
- Lépésről lépésre magyarázd el, ha útmutatót adsz
- Rövid, érthető mondatokat használj
- Ha a dokumentáció más nyelven van, fordítsd le magyarra

PÉLDA JÓ VÁLASZRA (figyeld a sortöréseket!):
"Igen, tudsz háttérképet beállítani a Raconában!

Így teheted meg:

1. Nyisd meg a Beállítások alkalmazást
2. Menj az Asztal menüpontra
3. Válaszd ki a Háttér almenüt
4. Itt három lehetőséged van: szín, kép vagy videó háttér

Ha képet szeretnél:

- Választhatsz az előre telepített képek közül
- Vagy feltölthetsz saját képet (JPG, PNG, WebP formátumban)
- A kép automatikusan igazodik a képernyő méretéhez

Ennyi az egész!"`;
			} else {
				systemPrompt = `You are the official AI assistant for the Racona web-based operating system.

Racona is a modern web-based operating system that runs in the browser with a desktop environment, applications, settings, and a plugin system.

IMPORTANT RULES:
1. ONLY answer questions about the Racona system
2. ALWAYS base your answers on the attached documentation - if documentation is provided, you MUST use it
3. If the question is NOT about Racona, politely explain that you can only answer Racona-specific questions
4. If there is NO answer in the documentation, honestly say that you don't have information about this
5. DO NOT make up information - only say what is in the documentation

RESPONSE FORMATTING - CRITICAL:
- Respond in English, using natural conversational style, as if explaining to a friend
- NEVER use markdown formatting: NEVER use **, ##, ###, *, _, \`, etc.
- You MUST use line breaks between paragraphs
- Use ONLY plain text
- Add an empty line after each paragraph
- For lists, use simple dashes (-) or numbers (1., 2., 3.)
- Explain step-by-step if providing instructions
- Use short, clear sentences
- If the documentation is in a different language, translate it to English

EXAMPLE OF GOOD RESPONSE (notice the line breaks!):
"Yes, you can set a background image in Racona!

Here's how:

1. Open the Settings application
2. Go to the Desktop menu
3. Select the Background submenu
4. You have three options: color, image, or video background

If you want an image:

- Choose from pre-installed images
- Or upload your own image (JPG, PNG, WebP formats)
- The image automatically adjusts to your screen size

That's it!"`;
			}

			// User message kiegészítése Knowledge Base kontextussal
			let userMessage = data.message;
			if (contextFromKnowledgeBase) {
				userMessage += contextFromKnowledgeBase;
				console.log('[AiChat] Knowledge Base kontextus hozzáadva a user message-hez:', {
					originalMessage: data.message,
					contextLength: contextFromKnowledgeBase.length,
					fullMessage: userMessage.substring(0, 500) + '...'
				});
			} else {
				console.log('[AiChat] Nincs Knowledge Base kontextus');
			}

			// Provider-specifikus API hívás
			switch (provider) {
				case 'gemini': {
					const url =
						baseUrl ||
						(await getProviderConfigValue('gemini', 'base_url')) ||
						'https://generativelanguage.googleapis.com/v1beta/models';
					const model =
						modelName ||
						(await getProviderConfigValue('gemini', 'default_model', 'AI_GEMINI_DEFAULT_MODEL')) ||
						'gemini-2.5-flash';
					const apiUrl = `${url}/${model}:generateContent?key=${apiKey}`;

					// Conversation history formázása Gemini formátumra
					const contents = [];

					// System message hozzáadása a Racona-specifikus instrukcióval
					contents.push({
						role: 'user',
						parts: [{ text: systemPrompt }]
					});
					contents.push({
						role: 'model',
						parts: [{ text: 'Understood.' }]
					});

					if (data.conversationHistory && data.conversationHistory.length > 0) {
						for (const msg of data.conversationHistory) {
							contents.push({
								role: msg.role === 'assistant' ? 'model' : 'user',
								parts: [{ text: msg.content }]
							});
						}
					}
					// Aktuális üzenet hozzáadása
					contents.push({
						role: 'user',
						parts: [{ text: userMessage }]
					});

					const response = await fetch(apiUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ contents })
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Gemini API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					const result = await response.json();
					const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				case 'groq': {
					const url =
						baseUrl ||
						(await getProviderConfigValue('groq', 'base_url')) ||
						'https://api.groq.com/openai/v1/chat/completions';
					const model =
						modelName ||
						(await getProviderConfigValue('groq', 'default_model', 'AI_GROQ_DEFAULT_MODEL')) ||
						'llama-3.3-70b-versatile';

					// Conversation history formázása OpenAI formátumra
					const messages = [];

					// System message hozzáadása a Racona-specifikus instrukcióval
					messages.push({
						role: 'system',
						content: systemPrompt
					});

					if (data.conversationHistory && data.conversationHistory.length > 0) {
						for (const msg of data.conversationHistory) {
							messages.push({
								role: msg.role,
								content: msg.content
							});
						}
					}
					// Aktuális üzenet hozzáadása
					messages.push({
						role: 'user',
						content: userMessage
					});

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model,
							messages
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Groq API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					const result = await response.json();
					const text = result.choices?.[0]?.message?.content;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				case 'openai': {
					const url =
						baseUrl ||
						(await getProviderConfigValue('openai', 'base_url')) ||
						'https://api.openai.com/v1/chat/completions';
					const model =
						modelName ||
						(await getProviderConfigValue('openai', 'default_model', 'AI_OPENAI_DEFAULT_MODEL')) ||
						'gpt-4o-mini';

					// Conversation history formázása OpenAI formátumra
					const messages = [];

					// System message hozzáadása a Racona-specifikus instrukcióval
					messages.push({
						role: 'system',
						content: systemPrompt
					});

					if (data.conversationHistory && data.conversationHistory.length > 0) {
						for (const msg of data.conversationHistory) {
							messages.push({
								role: msg.role,
								content: msg.content
							});
						}
					}
					// Aktuális üzenet hozzáadása
					messages.push({
						role: 'user',
						content: userMessage
					});

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model,
							messages
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `OpenAI API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					const result = await response.json();
					const text = result.choices?.[0]?.message?.content;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				case 'anthropic': {
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

					// Conversation history formázása Anthropic formátumra
					const messages = [];

					// System message hozzáadása a Racona-specifikus instrukcióval
					messages.push({
						role: 'user',
						content: systemPrompt
					});
					messages.push({
						role: 'assistant',
						content: 'Understood.'
					});

					if (data.conversationHistory && data.conversationHistory.length > 0) {
						for (const msg of data.conversationHistory) {
							messages.push({
								role: msg.role,
								content: msg.content
							});
						}
					}
					// Aktuális üzenet hozzáadása
					messages.push({
						role: 'user',
						content: userMessage
					});

					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': apiKey,
							'anthropic-version': '2023-06-01'
						},
						body: JSON.stringify({
							model,
							messages,
							max_tokens: 1024
						})
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						return {
							success: false,
							error: `Anthropic API hiba: ${errorData.error?.message || response.statusText}`
						};
					}

					const result = await response.json();
					const text = result.content?.[0]?.text;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				case 'huggingface': {
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
					const apiUrl = baseUrl ? url : `https://api-inference.huggingface.co/models/${model}`;

					// Hugging Face Inference API egyszerűbb formátum
					let prompt = `${systemPrompt}\n\n${userMessage}`;
					if (data.conversationHistory && data.conversationHistory.length > 0) {
						// Conversation history hozzáfűzése a prompthoz
						const history = data.conversationHistory
							.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
							.join('\n');
						prompt = `${systemPrompt}\n\n${history}\nUser: ${userMessage}\nAssistant:`;
					}

					const response = await fetch(apiUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							inputs: prompt,
							parameters: {
								max_new_tokens: 512,
								temperature: 0.7
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

					const result = await response.json();
					const text = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				case 'custom': {
					if (!baseUrl) {
						return {
							success: false,
							error: 'Egyéni endpoint esetén az alap URL megadása kötelező'
						};
					}

					// OpenAI-kompatibilis formátum
					const messages = [];

					// System message hozzáadása a Racona-specifikus instrukcióval
					messages.push({
						role: 'system',
						content: systemPrompt
					});

					if (data.conversationHistory && data.conversationHistory.length > 0) {
						for (const msg of data.conversationHistory) {
							messages.push({
								role: msg.role,
								content: msg.content
							});
						}
					}
					messages.push({
						role: 'user',
						content: userMessage
					});

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
							messages
						})
					});

					if (!response.ok) {
						return {
							success: false,
							error: `Egyéni API hiba: ${response.statusText}`
						};
					}

					const result = await response.json();
					const text = result.choices?.[0]?.message?.content;

					if (!text) {
						return {
							success: false,
							error: 'Nem érkezett válasz az AI-tól.'
						};
					}

					return {
						success: true,
						response: text + (dev ? knowledgeBaseInfo : '')
					};
				}

				default:
					return {
						success: false,
						error: 'Ismeretlen provider típus'
					};
			}
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
