/**
 * AI Chat Remote Actions
 *
 * AI Agent chat funkció - server-side actions.
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { agentConfigRepository } from '$lib/server/database/repositories';

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

			// Provider-specifikus API hívás
			switch (provider) {
				case 'gemini': {
					const url = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
					const model = modelName || 'gemini-2.0-flash-exp';
					const apiUrl = `${url}/${model}:generateContent?key=${apiKey}`;

					// Conversation history formázása Gemini formátumra
					const contents = [];
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
						parts: [{ text: data.message }]
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
						response: text
					};
				}

				case 'groq': {
					const url = baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
					const model = modelName || 'llama-3.3-70b-versatile';

					// Conversation history formázása OpenAI formátumra
					const messages = [];
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
						content: data.message
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
						response: text
					};
				}

				case 'openai': {
					const url = baseUrl || 'https://api.openai.com/v1/chat/completions';
					const model = modelName || 'gpt-4o-mini';

					// Conversation history formázása OpenAI formátumra
					const messages = [];
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
						content: data.message
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
						response: text
					};
				}

				case 'anthropic': {
					const url = baseUrl || 'https://api.anthropic.com/v1/messages';
					const model = modelName || 'claude-3-5-sonnet-20241022';

					// Conversation history formázása Anthropic formátumra
					const messages = [];
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
						content: data.message
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
						response: text
					};
				}

				case 'huggingface': {
					const url =
						baseUrl ||
						'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
					const model = modelName || 'mistralai/Mistral-7B-Instruct-v0.2';
					const apiUrl = baseUrl ? url : `https://api-inference.huggingface.co/models/${model}`;

					// Hugging Face Inference API egyszerűbb formátum
					let prompt = data.message;
					if (data.conversationHistory && data.conversationHistory.length > 0) {
						// Conversation history hozzáfűzése a prompthoz
						const history = data.conversationHistory
							.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
							.join('\n');
						prompt = `${history}\nUser: ${data.message}\nAssistant:`;
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
						response: text
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
						content: data.message
					});

					const response = await fetch(baseUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`
						},
						body: JSON.stringify({
							model: modelName || 'default',
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
						response: text
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
