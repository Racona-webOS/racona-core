/**
 * AI provider hívások
 *
 * Egységes felület a támogatott chat providerekhez. Providerenként csak a
 * kérés összeállítása és a válasz feldolgozása tér el; a hívás, a hibakezelés
 * és az időkorlát közös.
 */

/** Egy korábbi üzenet a beszélgetésből */
export interface ChatHistoryMessage {
	role: 'user' | 'assistant';
	content: string;
}

/** Egy chat kérés minden adata, már feloldott modellel és URL-lel */
export interface ChatProviderRequest {
	provider: string;
	apiKey: string;
	model: string;
	url: string;
	params: {
		maxTokens: number;
		temperature: number;
		topP: number;
	};
	system: string;
	history: ChatHistoryMessage[];
	userMessage: string;
}

export type ChatProviderResult =
	| { success: true; text: string }
	| { success: false; error: string };

/** Provider alapértelmezések: ha sem az admin konfiguráció, sem az adatbázis nem ad értéket */
export const PROVIDER_DEFAULTS: Record<
	string,
	{ label: string; url?: string; model: string; modelEnvKey: string }
> = {
	gemini: {
		label: 'Gemini',
		url: 'https://generativelanguage.googleapis.com/v1beta/models',
		model: 'gemini-2.5-flash',
		modelEnvKey: 'AI_GEMINI_DEFAULT_MODEL'
	},
	groq: {
		label: 'Groq',
		url: 'https://api.groq.com/openai/v1/chat/completions',
		model: 'llama-3.3-70b-versatile',
		modelEnvKey: 'AI_GROQ_DEFAULT_MODEL'
	},
	openai: {
		label: 'OpenAI',
		url: 'https://api.openai.com/v1/chat/completions',
		model: 'gpt-4o-mini',
		modelEnvKey: 'AI_OPENAI_DEFAULT_MODEL'
	},
	anthropic: {
		label: 'Anthropic',
		url: 'https://api.anthropic.com/v1/messages',
		model: 'claude-opus-5-5',
		modelEnvKey: 'AI_ANTHROPIC_DEFAULT_MODEL'
	},
	huggingface: {
		label: 'Hugging Face',
		url: 'https://api-inference.huggingface.co/models',
		model: 'mistralai/Mistral-7B-Instruct-v0.2',
		modelEnvKey: 'AI_HUGGINGFACE_DEFAULT_MODEL'
	},
	custom: {
		label: 'Egyéni',
		// Egyéni endpointnál az URL megadása kötelező
		model: 'default',
		modelEnvKey: 'AI_CUSTOM_DEFAULT_MODEL'
	}
};

/** Egy provider hívás időkorlátja */
const REQUEST_TIMEOUT_MS = 60_000;

interface ProviderAdapter {
	buildRequest(req: ChatProviderRequest): { url: string; init: RequestInit };
	/** A válaszból kinyert szöveg, vagy hibaüzenet */
	parseResponse(json: unknown): { text?: string; error?: string };
	/** Hibaüzenet kinyerése egy nem-2xx válaszból */
	parseError(json: unknown): string | undefined;
}

/** A providerek hibaválaszának közös formája */
interface ErrorResponse {
	error?: string | { message?: string };
}

function errorMessage(json: unknown): string | undefined {
	const { error } = json as ErrorResponse;
	return typeof error === 'string' ? error : error?.message;
}

// ============================================================================
// OpenAI-kompatibilis (OpenAI, Groq, egyéni endpoint)
// ============================================================================

const openAICompatible: ProviderAdapter = {
	buildRequest(req) {
		return {
			url: req.url,
			init: {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${req.apiKey}`
				},
				body: JSON.stringify({
					model: req.model,
					messages: [
						{ role: 'system', content: req.system },
						...req.history,
						{ role: 'user', content: req.userMessage }
					],
					max_tokens: req.params.maxTokens,
					temperature: req.params.temperature,
					top_p: req.params.topP
				})
			}
		};
	},
	parseResponse(json) {
		const data = json as { choices?: { message?: { content?: string } }[] };
		return { text: data.choices?.[0]?.message?.content };
	},
	parseError: errorMessage
};

// ============================================================================
// Google Gemini
// ============================================================================

const gemini: ProviderAdapter = {
	buildRequest(req) {
		return {
			url: `${req.url}/${req.model}:generateContent`,
			init: {
				headers: {
					'Content-Type': 'application/json',
					// Fejlécben küldjük, hogy az API kulcs ne kerüljön URL-be (és naplókba)
					'x-goog-api-key': req.apiKey
				},
				body: JSON.stringify({
					systemInstruction: { parts: [{ text: req.system }] },
					contents: [
						...req.history.map((msg) => ({
							role: msg.role === 'assistant' ? 'model' : 'user',
							parts: [{ text: msg.content }]
						})),
						{ role: 'user', parts: [{ text: req.userMessage }] }
					],
					generationConfig: {
						maxOutputTokens: req.params.maxTokens,
						temperature: req.params.temperature,
						topP: req.params.topP
					}
				})
			}
		};
	},
	parseResponse(json) {
		const data = json as {
			candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
		};
		const parts = data.candidates?.[0]?.content?.parts ?? [];
		const text = parts
			.filter((part) => !part.thought && part.text)
			.map((part) => part.text)
			.join('');
		return { text };
	},
	parseError: errorMessage
};

// ============================================================================
// Anthropic (Claude)
// ============================================================================

/**
 * Az újabb Claude modellek (Opus 4.7+, Sonnet 5+, Fable, Mythos) 400-as hibát
 * adnak, ha temperature / top_p értéket kapnak.
 */
function anthropicSupportsSampling(model: string): boolean {
	return !/^claude-(opus-(4-[78]|5)|sonnet-5|fable|mythos)/.test(model);
}

/** Az effort paramétert ismerő Claude modellek */
function anthropicSupportsEffort(model: string): boolean {
	return /^claude-(opus-(4-[5-8]|5)|sonnet-(4-6|5)|fable|mythos)/.test(model);
}

/**
 * A szerveroldali fallbacket támogató modellek: ha a modell biztonsági okból
 * elutasít egy kérést, az API automatikusan egy másik modellel válaszol.
 * Csak a hivatalos Anthropic API-n érhető el.
 */
function anthropicSupportsFallback(model: string, url: string): boolean {
	return (
		/^claude-(fable-5-1|opus-5(-5)?|sonnet-5-5)$/.test(model) &&
		new URL(url).hostname === 'api.anthropic.com'
	);
}

const anthropic: ProviderAdapter = {
	buildRequest(req) {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'x-api-key': req.apiKey,
			'anthropic-version': '2023-06-01'
		};
		const body: Record<string, unknown> = {
			model: req.model,
			max_tokens: req.params.maxTokens,
			system: req.system,
			messages: [...req.history, { role: 'user', content: req.userMessage }]
		};

		if (anthropicSupportsSampling(req.model)) {
			// Az Anthropic API nem támogatja a temperature és top_p egyidejű használatát
			body.temperature = req.params.temperature;
		}
		if (anthropicSupportsEffort(req.model)) {
			// Dokumentáció alapú kérdés-válasz: nem igényel mély gondolkodást
			body.output_config = { effort: 'low' };
		}
		if (anthropicSupportsFallback(req.model, req.url)) {
			headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
			body.fallbacks = 'default';
		}

		return { url: req.url, init: { headers, body: JSON.stringify(body) } };
	},
	parseResponse(json) {
		const data = json as { content?: { type: string; text?: string }[]; stop_reason?: string };
		if (data.stop_reason === 'refusal') {
			return { error: 'Az AI nem válaszolt erre a kérdésre.' };
		}
		const text = (data.content ?? [])
			.filter((block) => block.type === 'text')
			.map((block) => block.text)
			.join('');
		if (!text && data.stop_reason === 'max_tokens') {
			return {
				error: 'A válasz túllépte a beállított maximális tokenszámot. Növeld a Max tokens értéket.'
			};
		}
		return { text };
	},
	parseError: errorMessage
};

// ============================================================================
// Hugging Face Inference API
// ============================================================================

const huggingface: ProviderAdapter = {
	buildRequest(req) {
		const history = req.history
			.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
			.join('\n');
		const prompt = `${req.system}\n\n${history ? `${history}\n` : ''}User: ${req.userMessage}\nAssistant:`;

		return {
			url: req.url,
			init: {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${req.apiKey}`
				},
				body: JSON.stringify({
					inputs: prompt,
					parameters: {
						max_new_tokens: req.params.maxTokens,
						temperature: req.params.temperature,
						top_p: req.params.topP,
						// Csak a generált szöveg kell, a prompt nélkül
						return_full_text: false
					}
				})
			}
		};
	},
	parseResponse(json) {
		type Generated = { generated_text?: string };
		const data = json as Generated | Generated[];
		return { text: Array.isArray(data) ? data[0]?.generated_text : data.generated_text };
	},
	parseError: errorMessage
};

const ADAPTERS: Record<string, ProviderAdapter> = {
	openai: openAICompatible,
	groq: openAICompatible,
	custom: openAICompatible,
	gemini,
	anthropic,
	huggingface
};

/**
 * Chat üzenet küldése a megadott providernek
 */
export async function callChatProvider(req: ChatProviderRequest): Promise<ChatProviderResult> {
	const adapter = ADAPTERS[req.provider];
	if (!adapter) {
		return { success: false, error: 'Ismeretlen provider típus' };
	}

	const label = PROVIDER_DEFAULTS[req.provider]?.label ?? req.provider;
	const { url, init } = adapter.buildRequest(req);

	const response = await fetch(url, {
		...init,
		method: 'POST',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});

	const json = await response.json().catch(() => ({}));

	if (!response.ok) {
		return {
			success: false,
			error: `${label} API hiba: ${adapter.parseError(json) || response.statusText}`
		};
	}

	const { text, error } = adapter.parseResponse(json);
	if (error) {
		return { success: false, error };
	}
	if (!text) {
		return { success: false, error: 'Nem érkezett válasz az AI-tól.' };
	}

	return { success: true, text };
}
