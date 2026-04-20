/**
 * AI Assistant típusdefiníciók
 */

/** Az AI asszisztens által megjelenítható érzelmi állapotok */
export type EmotionState = 'happy' | 'confused' | 'thinking' | 'neutral' | 'surprised';

/** Egy chat üzenet reprezentációja */
export interface ChatMessage {
	/** Egyedi azonosító (crypto.randomUUID()) */
	id: string;
	/** Az üzenet küldője */
	role: 'user' | 'assistant';
	/** Az üzenet szöveges tartalma */
	content: string;
	/** Létrehozás időbélyege (Date.now()) */
	timestamp: number;
	/** Csak assistant üzenetekhez: a detektált érzelmi állapot */
	emotionState?: EmotionState;
	/** Hibaüzenet-e (piros háttér) */
	isError?: boolean;
	/** Javasolt alkalmazás megnyitásához (csak assistant üzenetekhez) */
	suggestedApp?: {
		appName: string;
		section?: string;
	};
}

/** A teljes beszélgetési előzmény */
export interface ConversationHistory {
	messages: ChatMessage[];
	lastUpdated: number;
}

/** Egy cache bejegyzés egy kérdés-válasz párhoz */
export interface ResponseCacheEntry {
	/** Normalizált kérdés (trim + lowercase) */
	question: string;
	answer: string;
	/** Cache létrehozás időbélyege (Date.now()) */
	timestamp: number;
	/** Élettartam milliszekundumban (alapértelmezett: 3 600 000 = 1 óra) */
	ttl: number;
}

/** Az AI asszisztens konfigurációs beállításai */
export interface AiAssistantConfig {
	/** Maximálisan tárolt üzenetek száma (alapértelmezett: 50) */
	maxHistoryLength: number;
	/** Maximális kérdés hossz karakterben (alapértelmezett: 500) */
	maxQuestionLength: number;
	/** Cache élettartam milliszekundumban (alapértelmezett: 3 600 000) */
	cacheTtlMs: number;
}
