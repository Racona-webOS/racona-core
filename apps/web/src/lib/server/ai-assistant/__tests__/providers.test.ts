// @vitest-environment node
/**
 * AI provider kérések összeállítása és válaszok feldolgozása (mockolt fetch).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { callChatProvider, type ChatProviderRequest } from '../providers';

function baseRequest(overrides: Partial<ChatProviderRequest>): ChatProviderRequest {
	return {
		provider: 'openai',
		apiKey: 'test-key',
		model: 'test-model',
		url: 'https://example.test/v1',
		params: { maxTokens: 1000, temperature: 0.7, topP: 0.9 },
		system: 'RENDSZERPROMPT',
		history: [
			{ role: 'user', content: 'előző kérdés' },
			{ role: 'assistant', content: 'előző válasz' }
		],
		userMessage: 'aktuális kérdés',
		...overrides
	};
}

function mockFetch(body: unknown, status = 200) {
	const fetchMock = vi.fn().mockResolvedValue(
		new Response(JSON.stringify(body), {
			status,
			headers: { 'Content-Type': 'application/json' }
		})
	);
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

function sentRequest(fetchMock: ReturnType<typeof vi.fn>) {
	const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
	return {
		url,
		headers: init.headers as Record<string, string>,
		body: JSON.parse(init.body as string)
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Anthropic', () => {
	it('a rendszerpromptot a system mezőben küldi, sampling nélkül az új modelleknél', async () => {
		const fetchMock = mockFetch({
			content: [
				{ type: 'thinking', thinking: '' },
				{ type: 'text', text: 'Válasz' }
			],
			stop_reason: 'end_turn'
		});

		const result = await callChatProvider(
			baseRequest({
				provider: 'anthropic',
				model: 'claude-opus-5-5',
				url: 'https://api.anthropic.com/v1/messages'
			})
		);

		expect(result).toEqual({ success: true, text: 'Válasz' });
		const { body, headers } = sentRequest(fetchMock);
		expect(body.system).toBe('RENDSZERPROMPT');
		expect(body.messages[0]).toEqual({ role: 'user', content: 'előző kérdés' });
		expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'aktuális kérdés' });
		expect(body.temperature).toBeUndefined();
		expect(body.top_p).toBeUndefined();
		expect(body.output_config).toEqual({ effort: 'low' });
		expect(body.fallbacks).toBe('default');
		expect(headers['anthropic-beta']).toBe('server-side-fallback-2026-07-01');
	});

	it('régebbi modellnél küld temperature-t, fallback és effort nélkül', async () => {
		const fetchMock = mockFetch({ content: [{ type: 'text', text: 'ok' }] });

		await callChatProvider(
			baseRequest({
				provider: 'anthropic',
				model: 'claude-haiku-4-5',
				url: 'https://api.anthropic.com/v1/messages'
			})
		);

		const { body, headers } = sentRequest(fetchMock);
		expect(body.temperature).toBe(0.7);
		expect(body.output_config).toBeUndefined();
		expect(body.fallbacks).toBeUndefined();
		expect(headers['anthropic-beta']).toBeUndefined();
	});

	it('egyéni endpointon nem kér fallbacket', async () => {
		const fetchMock = mockFetch({ content: [{ type: 'text', text: 'ok' }] });

		await callChatProvider(
			baseRequest({
				provider: 'anthropic',
				model: 'claude-opus-5-5',
				url: 'https://proxy.example.test/v1/messages'
			})
		);

		expect(sentRequest(fetchMock).body.fallbacks).toBeUndefined();
	});

	it('elutasított kérésnél hibát ad vissza', async () => {
		mockFetch({ content: [], stop_reason: 'refusal' });

		const result = await callChatProvider(
			baseRequest({ provider: 'anthropic', model: 'claude-opus-5-5' })
		);

		expect(result.success).toBe(false);
	});
});

describe('Gemini', () => {
	it('systemInstruction-t használ, a kulcs fejlécben megy', async () => {
		const fetchMock = mockFetch({
			candidates: [
				{ content: { parts: [{ text: 'gondolat', thought: true }, { text: 'Válasz' }] } }
			]
		});

		const result = await callChatProvider(
			baseRequest({ provider: 'gemini', model: 'gemini-2.5-flash' })
		);

		expect(result).toEqual({ success: true, text: 'Válasz' });
		const { url, headers, body } = sentRequest(fetchMock);
		expect(url).toBe('https://example.test/v1/gemini-2.5-flash:generateContent');
		expect(url).not.toContain('test-key');
		expect(headers['x-goog-api-key']).toBe('test-key');
		expect(body.systemInstruction.parts[0].text).toBe('RENDSZERPROMPT');
		expect(body.contents[1]).toEqual({ role: 'model', parts: [{ text: 'előző válasz' }] });
	});
});

describe('OpenAI-kompatibilis', () => {
	it.each(['openai', 'groq', 'custom'])('%s: system üzenettel kezdődik', async (provider) => {
		const fetchMock = mockFetch({ choices: [{ message: { content: 'Válasz' } }] });

		const result = await callChatProvider(baseRequest({ provider }));

		expect(result).toEqual({ success: true, text: 'Válasz' });
		const { headers, body } = sentRequest(fetchMock);
		expect(headers.Authorization).toBe('Bearer test-key');
		expect(body.messages[0]).toEqual({ role: 'system', content: 'RENDSZERPROMPT' });
		expect(body.messages).toHaveLength(4);
	});

	it('API hibánál a provider üzenetét adja vissza', async () => {
		mockFetch({ error: { message: 'Invalid API key' } }, 401);

		const result = await callChatProvider(baseRequest({ provider: 'openai' }));

		expect(result).toEqual({ success: false, error: 'OpenAI API hiba: Invalid API key' });
	});
});

describe('Hugging Face', () => {
	it('csak a generált szöveget kéri vissza', async () => {
		const fetchMock = mockFetch([{ generated_text: 'Válasz' }]);

		const result = await callChatProvider(baseRequest({ provider: 'huggingface' }));

		expect(result).toEqual({ success: true, text: 'Válasz' });
		const { body } = sentRequest(fetchMock);
		expect(body.parameters.return_full_text).toBe(false);
		expect(body.inputs).toContain('User: aktuális kérdés\nAssistant:');
	});
});

it('ismeretlen providernél hibát ad', async () => {
	const result = await callChatProvider(baseRequest({ provider: 'nincs-ilyen' }));
	expect(result.success).toBe(false);
});
