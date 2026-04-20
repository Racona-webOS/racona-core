/**
 * AI Assistant store — Svelte 5 runes alapú állapotkezelés
 */

import { getContext, setContext } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type {
	AiAssistantConfig,
	ChatMessage,
	EmotionState,
	ResponseCacheEntry
} from '../types/index.js';
import { sendChatMessage, getWelcomeMessage } from '../chat.remote.js';

const AI_ASSISTANT_STORE_KEY = Symbol('aiAssistantStore');

/** Alapértelmezett konfiguráció */
const DEFAULT_CONFIG: AiAssistantConfig = {
	maxHistoryLength: 50,
	maxQuestionLength: 500,
	cacheTtlMs: 3_600_000 // 1 óra
};

/** Kulcsszó-alapú érzelem detektálás szótára */
const EMOTION_KEYWORDS: Record<EmotionState, string[]> = {
	happy: [
		'köszön',
		'remek',
		'kiváló',
		'nagyszerű',
		'örül',
		'siker',
		'gratulál',
		'bravo',
		'helyes',
		'tökéletes',
		'thank',
		'great',
		'excellent',
		'perfect',
		'awesome',
		'wonderful',
		'fantastic'
	],
	confused: [
		'nem értem',
		'nem tudom',
		'bizonytalan',
		'kérdéses',
		'homályos',
		'zavaros',
		'unclear',
		'confused',
		'uncertain',
		'not sure',
		"don't know",
		'hmm',
		'sajnos nem'
	],
	thinking: [
		'gondolkod',
		'elemz',
		'vizsgál',
		'feldolgoz',
		'számít',
		'kiszámít',
		'meghatároz',
		'analyzing',
		'processing',
		'calculating',
		'considering',
		'evaluating',
		'let me think',
		'hadd gondolj'
	],
	surprised: [
		'meglepő',
		'váratlan',
		'érdekes',
		'figyelemre méltó',
		'wow',
		'surprising',
		'unexpected',
		'interesting',
		'remarkable',
		'incredible',
		'amazing',
		'unbelievable'
	],
	neutral: []
};

/** Az érvényes EmotionState értékek halmaza */
const VALID_EMOTIONS = new SvelteSet<EmotionState>([
	'happy',
	'confused',
	'thinking',
	'neutral',
	'surprised'
]);

class AiAssistantStore {
	// --- Reaktív állapot ---
	isOpen = $state(false);
	currentEmotion = $state<EmotionState>('neutral');
	messages = $state<ChatMessage[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	isTyping = $state(false); // Felhasználó gépel-e
	headAnimationMode = $state<'idle' | 'idle2' | 'typing' | 'breathing'>('idle'); // Fej animáció állapot
	avatarModelUrl = $state<string | undefined>(undefined); // Avatar modell URL
	#userId: string | null = null; // Aktuális felhasználó ID-ja

	// --- Derived értékek ---
	readonly hasMessages = $derived(this.messages.length > 0);
	readonly canSend = $derived(!this.loading);
	readonly showChatBubbles = $derived(this.isOpen && this.hasMessages); // chat buborékok csak akkor láthatók
	readonly showInputField = $derived(this.isOpen); // input mező csak akkor látható

	// --- Privát mezők ---
	#cache = new SvelteMap<string, ResponseCacheEntry>();
	#config: AiAssistantConfig = { ...DEFAULT_CONFIG };

	// --- Avatar konfiguráció ---

	/** Beállítja az avatar modell URL-t */
	setAvatarModelUrl(url: string | undefined): void {
		console.log('[AiAssistantStore] Avatar model URL frissítve:', url);
		this.avatarModelUrl = url;
	}

	// --- Panel vezérlés ---

	/** Megnyitja a chat panelt */
	open(): void {
		this.isOpen = true;
	}

	/** Bezárja a chat panelt */
	close(): void {
		this.isOpen = false;
	}

	/** Váltja a chat panel nyitott/zárt állapotát */
	toggle(): void {
		this.isOpen = !this.isOpen;
	}

	// --- Gépelés követés ---

	#typingTimeout: ReturnType<typeof setTimeout> | null = null;
	#breathingTimeout: ReturnType<typeof setTimeout> | null = null;
	#idleTimeout: ReturnType<typeof setTimeout> | null = null;

	/** Jelzi, hogy a felhasználó gépel */
	startTyping(): void {
		this.isTyping = true;
		this.headAnimationMode = 'typing';

		// Töröljük a korábbi timeout-okat
		if (this.#typingTimeout) {
			clearTimeout(this.#typingTimeout);
		}
		if (this.#breathingTimeout) {
			clearTimeout(this.#breathingTimeout);
		}
		if (this.#idleTimeout) {
			clearTimeout(this.#idleTimeout);
		}

		// 3 másodperc után visszaállunk középre (breathing előkészítés)
		this.#typingTimeout = setTimeout(() => {
			this.isTyping = false;
			this.headAnimationMode = 'breathing';

			// 4-5 másodperc után idle2 módba váltunk (természetes nézelődés)
			this.#idleTimeout = setTimeout(() => {
				this.headAnimationMode = 'idle2';
			}, 4500); // 4.5 másodperc
		}, 3000);
	}

	/** Leállítja a gépelés jelzést */
	stopTyping(): void {
		this.isTyping = false;
		if (this.#typingTimeout) {
			clearTimeout(this.#typingTimeout);
			this.#typingTimeout = null;
		}
		if (this.#breathingTimeout) {
			clearTimeout(this.#breathingTimeout);
			this.#breathingTimeout = null;
		}
		if (this.#idleTimeout) {
			clearTimeout(this.#idleTimeout);
			this.#idleTimeout = null;
		}
		// Küldés után maradjon typing módban, DE indítsunk egy timeout-ot
		// ami 3mp után breathing módba állítja (ha nem kezd el újra gépelni)
		this.#typingTimeout = setTimeout(() => {
			this.headAnimationMode = 'breathing';

			// 4-5 másodperc után idle2 módba váltunk (természetes nézelődés)
			this.#idleTimeout = setTimeout(() => {
				this.headAnimationMode = 'idle2';
			}, 4500); // 4.5 másodperc
		}, 3000);
	}

	// --- Érzelem detektálás ---

	/**
	 * Kulcsszó-alapú érzelem detektálás a válasz szövegéből.
	 * Mindig érvényes EmotionState értéket ad vissza.
	 */
	detectEmotion(text: string): EmotionState {
		if (!text || text.trim().length === 0) {
			return 'neutral';
		}

		const lower = text.toLowerCase();

		for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [
			EmotionState,
			string[]
		][]) {
			if (emotion === 'neutral') continue;
			if (keywords.some((kw) => lower.includes(kw))) {
				return emotion;
			}
		}

		return 'neutral';
	}

	// --- Cache kezelés ---

	/** Normalizálja a kérdést cache kulcshoz (trim + lowercase) */
	#normalizeQuestion(question: string): string {
		return question.trim().toLowerCase();
	}

	/** Visszaadja a cache-elt választ, ha érvényes (nem járt le) */
	getCachedResponse(question: string): string | null {
		const key = this.#normalizeQuestion(question);
		const entry = this.#cache.get(key);
		if (!entry) return null;

		const isExpired = Date.now() - entry.timestamp > entry.ttl;
		if (isExpired) {
			this.#cache.delete(key);
			return null;
		}

		return entry.answer;
	}

	/** Cache-eli a választ a konfigurált TTL-lel */
	setCachedResponse(question: string, answer: string): void {
		const key = this.#normalizeQuestion(question);
		this.#cache.set(key, {
			question: key,
			answer,
			timestamp: Date.now(),
			ttl: this.#config.cacheTtlMs
		});
	}

	// --- localStorage perzisztencia ---

	/** Beállítja az aktuális felhasználó ID-ját */
	setUserId(userId: string): void {
		this.#userId = userId;
	}

	/** Visszaadja a user-specifikus localStorage kulcsot */
	#getStorageKey(): string {
		return this.#userId
			? `racona_ai_assistant_history_${this.#userId}`
			: 'racona_ai_assistant_history';
	}

	/** Visszaadja a session-specifikus kulcsot az üdvözléshez */
	#getWelcomeSessionKey(): string {
		return this.#userId ? `racona_ai_welcomed_${this.#userId}` : 'racona_ai_welcomed';
	}

	/** Betölti a conversation history-t localStorage-ból */
	loadFromStorage(): void {
		console.log('[AiAssistantStore] loadFromStorage() called');
		if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') {
			console.log('[AiAssistantStore] localStorage or sessionStorage undefined');
			return;
		}

		// Session-based üdvözlés ellenőrzése
		const welcomeKey = this.#getWelcomeSessionKey();
		const hasWelcomedThisSession = sessionStorage.getItem(welcomeKey);

		console.log('[AiAssistantStore] welcomeKey:', welcomeKey);
		console.log('[AiAssistantStore] hasWelcomedThisSession:', hasWelcomedThisSession);

		try {
			const storageKey = this.#getStorageKey();
			const raw = localStorage.getItem(storageKey);

			console.log('[AiAssistantStore] storageKey:', storageKey);
			console.log('[AiAssistantStore] raw exists:', !!raw);

			if (!raw) {
				// Ha nincs localStorage adat és még nem köszöntünk, betöltjük az üdvözlő üzenetet
				if (!hasWelcomedThisSession) {
					console.log(
						'[AiAssistantStore] Nincs localStorage és nincs session flag, betöltjük az üdvözlő üzenetet'
					);
					// Session flag beállítása AZONNAL, hogy ne hívódjon meg többször
					sessionStorage.setItem(welcomeKey, 'true');
					this.loadWelcomeMessage();
				} else {
					console.log(
						'[AiAssistantStore] Nincs localStorage, de már köszöntünk ebben a session-ben'
					);
				}
				return;
			}

			const parsed = JSON.parse(raw) as { messages: ChatMessage[]; lastUpdated: number };

			// TTL ellenőrzés - environment változóból olvassuk (órában)
			const ttlHours =
				typeof process !== 'undefined' && process.env?.AI_CHAT_HISTORY_TTL_HOURS
					? parseInt(process.env.AI_CHAT_HISTORY_TTL_HOURS)
					: 24; // Default: 24 óra
			const ttlMs = ttlHours * 60 * 60 * 1000;
			const isExpired = Date.now() - parsed.lastUpdated > ttlMs;

			if (isExpired) {
				// Ha lejárt, töröljük és üdvözlő üzenettel kezdünk
				console.log(`[AiAssistantStore] Chat history lejárt (${ttlHours} óra), törlés...`);
				localStorage.removeItem(storageKey);
				if (!hasWelcomedThisSession) {
					// Session flag beállítása AZONNAL
					sessionStorage.setItem(welcomeKey, 'true');
					this.loadWelcomeMessage();
				}
				return;
			}

			if (Array.isArray(parsed.messages)) {
				// Biztosítjuk, hogy minden üzenetnek legyen isError property-je
				const messagesWithError = parsed.messages.map((msg) => ({
					...msg,
					isError: msg.isError ?? false
				}));
				this.messages = messagesWithError.slice(-this.#config.maxHistoryLength);

				// Ha még nem köszöntünk ebben a session-ben, hozzáadjuk az üdvözlő üzenetet az elejére
				if (!hasWelcomedThisSession) {
					// Session flag beállítása AZONNAL
					sessionStorage.setItem(welcomeKey, 'true');
					this.loadWelcomeMessage();
				}
			} else {
				// Ha a parsed.messages nem array és még nem köszöntünk, betöltjük az üdvözlő üzenetet
				if (!hasWelcomedThisSession) {
					// Session flag beállítása AZONNAL
					sessionStorage.setItem(welcomeKey, 'true');
					this.loadWelcomeMessage();
				}
			}
		} catch {
			// Graceful degradation: ha a localStorage nem olvasható
			if (!hasWelcomedThisSession) {
				// Session flag beállítása AZONNAL
				sessionStorage.setItem(welcomeKey, 'true');
				this.loadWelcomeMessage();
			}
		}
	}

	/** Betölti az üdvözlő üzenetet */
	async loadWelcomeMessage(): Promise<void> {
		console.log('[AiAssistantStore] loadWelcomeMessage() called');
		try {
			const result = await getWelcomeMessage({});
			console.log('[AiAssistantStore] getWelcomeMessage result:', result);
			if (result.success && result.message) {
				const welcomeMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: 'assistant',
					content: result.message,
					timestamp: Date.now(),
					emotionState: 'happy',
					isError: false
				};

				// Üdvözlő üzenetet az elejére tesszük
				this.messages = [welcomeMessage, ...this.messages];
				this.currentEmotion = 'happy';

				console.log(
					'[AiAssistantStore] Üdvözlő üzenet hozzáadva, messages length:',
					this.messages.length
				);

				// 3 másodperc után visszaállítjuk neutral állapotra
				setTimeout(() => {
					this.currentEmotion = 'neutral';
				}, 3000);

				this.saveToStorage();
			}
		} catch (err) {
			console.error('[AiAssistantStore] Üdvözlő üzenet betöltési hiba:', err);
		}
	}

	/** Elmenti a conversation history-t localStorage-ba */
	saveToStorage(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const storageKey = this.#getStorageKey();
			const toStore = {
				messages: this.messages.slice(-this.#config.maxHistoryLength),
				lastUpdated: Date.now()
			};
			localStorage.setItem(storageKey, JSON.stringify(toStore));
		} catch {
			// Graceful degradation: ha a localStorage nem írható, session-only history
		}
	}

	// --- Üzenet kezelés ---

	/** Törli az összes üzenetet és a localStorage-t */
	clearHistory(): void {
		this.messages = [];
		if (typeof localStorage !== 'undefined') {
			try {
				const storageKey = this.#getStorageKey();
				localStorage.removeItem(storageKey);
			} catch {
				// Graceful degradation
			}
		}
		if (typeof sessionStorage !== 'undefined') {
			try {
				const welcomeKey = this.#getWelcomeSessionKey();
				sessionStorage.removeItem(welcomeKey);
			} catch {
				// Graceful degradation
			}
		}
		// Üdvözlő üzenet újra betöltése
		this.loadWelcomeMessage();
	}

	/**
	 * Üzenetet küld az AI asszisztensnek.
	 */
	async sendMessage(question: string): Promise<void> {
		const trimmed = question.trim();

		// Validáció
		if (!trimmed) return;
		if (trimmed.length > this.#config.maxQuestionLength) {
			this.#addAssistantMessage(
				`A kérdés túl hosszú (maximum ${this.#config.maxQuestionLength} karakter).`,
				true
			);
			return;
		}

		// User üzenet hozzáadása
		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: trimmed,
			timestamp: Date.now()
		};

		this.messages = [...this.messages, userMessage].slice(-this.#config.maxHistoryLength);
		this.error = null;
		this.loading = true;

		try {
			console.log('[AiAssistantStore] Cache ellenőrzés...');
			// Cache ellenőrzés
			const cached = this.getCachedResponse(trimmed);
			if (cached) {
				console.log('[AiAssistantStore] Cache találat:', cached);
				this.#addAssistantMessage(cached);
				return;
			}

			console.log('[AiAssistantStore] Conversation history előkészítése...');
			// Conversation history előkészítése (utolsó 10 üzenet)
			const conversationHistory = this.messages
				.slice(-11, -1) // Utolsó 10 üzenet (az aktuális előtt)
				.map((msg) => ({
					role: msg.role,
					content: msg.content
				}));

			console.log('[AiAssistantStore] API hívás indítása...', {
				message: trimmed,
				historyLength: conversationHistory.length
			});
			// API hívás
			const result = await sendChatMessage({
				message: trimmed,
				conversationHistory
			});

			console.log('[AiAssistantStore] API válasz:', result);
			if (result.success && result.response) {
				console.log('[AiAssistantStore] Sikeres válasz, cache-elés és hozzáadás...');
				this.setCachedResponse(trimmed, result.response);
				this.#addAssistantMessage(result.response, false, result.suggestedApp);
			} else {
				console.log('[AiAssistantStore] API hiba:', result.error);
				// Hibaüzenetet chat üzenetként jelenítjük meg
				const errorMessage = result.error || 'Nem érkezett válasz az AI-tól.';
				this.#addAssistantMessage(errorMessage, true);
				this.currentEmotion = 'confused';

				// 5 másodperc után visszaállítjuk neutral állapotra
				setTimeout(() => {
					this.currentEmotion = 'neutral';
				}, 5000);
			}
		} catch (err) {
			console.error('[AiAssistantStore] Hiba az üzenet küldése során:', err);
			// Általános hibaüzenetet chat üzenetként jelenítjük meg
			this.#addAssistantMessage(
				'Az AI asszisztens jelenleg nem elérhető. Kérjük, próbálja újra később.',
				true
			);
			this.currentEmotion = 'confused';

			// 5 másodperc után visszaállítjuk neutral állapotra
			setTimeout(() => {
				this.currentEmotion = 'neutral';
			}, 5000);
		} finally {
			console.log('[AiAssistantStore] Loading = false');
			this.loading = false;
			this.saveToStorage();
		}
	}

	/** Hozzáad egy assistant üzenetet és frissíti az érzelmi állapotot */
	#addAssistantMessage(
		content: string,
		isError: boolean = false,
		suggestedApp?: { appName: string; section?: string }
	): void {
		// NE detektáljuk az érzelmet - maradjon neutral
		// const emotion = this.detectEmotion(content);
		const emotion: EmotionState = 'neutral';
		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content,
			timestamp: Date.now(),
			emotionState: emotion,
			isError,
			suggestedApp
		};

		this.messages = [...this.messages, assistantMessage].slice(-this.#config.maxHistoryLength);
		// NE változtassuk meg a currentEmotion-t - így nincs animáció
		// this.currentEmotion = emotion;
	}
}

// --- Globális fallback példány ---
let globalAiAssistantStore: AiAssistantStore | null = null;

/** Létrehozza (vagy visszaadja a meglévő) AiAssistantStore példányt */
export function createAiAssistantStore(): AiAssistantStore {
	if (!globalAiAssistantStore) {
		globalAiAssistantStore = new AiAssistantStore();
	}
	return globalAiAssistantStore;
}

/** Beállítja az AiAssistantStore-t a Svelte context-ben (layout szinten hívandó) */
export function setAiAssistantStore(store: AiAssistantStore): void {
	globalAiAssistantStore = store;
	setContext(AI_ASSISTANT_STORE_KEY, store);
}

/** Visszaadja az AiAssistantStore-t — context-ből, vagy globális fallback-ből */
export function getAiAssistantStore(): AiAssistantStore {
	try {
		const contextStore = getContext<AiAssistantStore>(AI_ASSISTANT_STORE_KEY);
		if (contextStore) return contextStore;
	} catch {
		// Komponensen kívüli hívás esetén globális fallback
	}

	if (!globalAiAssistantStore) {
		globalAiAssistantStore = new AiAssistantStore();
	}
	return globalAiAssistantStore;
}

export { AiAssistantStore, VALID_EMOTIONS, EMOTION_KEYWORDS };
export type { EmotionState };
