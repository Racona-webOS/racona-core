/**
 * Text-to-Speech service — Web Speech API alapú felolvasás
 * Beállítások az adatbázisban tárolva (user settings)
 */

import type { TTSSettings } from '$lib/types/settings';

export type TTSVoice = {
	name: string;
	lang: string;
	default: boolean;
};

export type TTSStatus = 'idle' | 'speaking' | 'paused';

class TTSService {
	#synthesis: SpeechSynthesis | null = null;
	#currentUtterance: SpeechSynthesisUtterance | null = null;

	status = $state<TTSStatus>('idle');
	availableVoices = $state<TTSVoice[]>([]);
	currentMessageId = $state<string | null>(null);

	// Beállítások (reaktív)
	enabled = $state(true);
	autoPlay = $state(false);
	rate = $state(1.0);
	pitch = $state(1.0);
	volume = $state(1.0);
	selectedVoice = $state<string | null>(null);

	constructor() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.#synthesis = window.speechSynthesis;
			this.#loadVoices();

			// Hangok betöltése (néhány böngészőben aszinkron)
			if (window.speechSynthesis.onvoiceschanged !== undefined) {
				window.speechSynthesis.onvoiceschanged = () => {
					this.#loadVoices();
				};
			}
		}
	}

	/** Elérhető hangok betöltése */
	#loadVoices(): void {
		if (!this.#synthesis) return;

		const voices = this.#synthesis.getVoices();
		this.availableVoices = voices.map((v) => ({
			name: v.name,
			lang: v.lang,
			default: v.default
		}));

		// Magyar hang automatikus kiválasztása, ha nincs még kiválasztva
		if (!this.selectedVoice && voices.length > 0) {
			const hungarianVoice = voices.find((v) => v.lang.startsWith('hu'));
			this.selectedVoice = hungarianVoice?.name || voices[0]?.name || null;
		}
	}

	/** Beállítások betöltése adatbázisból */
	loadSettings(settings: TTSSettings): void {
		this.enabled = settings.enabled;
		this.autoPlay = settings.autoPlay;
		this.rate = settings.rate;
		this.pitch = settings.pitch;
		this.volume = settings.volume;
		this.selectedVoice = settings.selectedVoice;
	}

	/** Aktuális beállítások lekérése */
	getSettings(): TTSSettings {
		return {
			enabled: this.enabled,
			autoPlay: this.autoPlay,
			rate: this.rate,
			pitch: this.pitch,
			volume: this.volume,
			selectedVoice: this.selectedVoice
		};
	}

	/** Szöveg felolvasása */
	speak(text: string, messageId: string): void {
		if (!this.#synthesis || !this.enabled) return;

		// Ha már beszél, állítsuk le
		if (this.status === 'speaking') {
			this.stop();
		}

		// Markdown formázás eltávolítása
		const cleanText = this.#cleanMarkdown(text);

		this.#speakInternal(cleanText, messageId);
	}

	/** Teszt felolvasás (mindig működik, függetlenül az enabled beállítástól) */
	speakTest(text: string): void {
		if (!this.#synthesis) return;

		// Ha már beszél, állítsuk le
		if (this.status === 'speaking') {
			this.stop();
		}

		this.#speakInternal(text, 'test-message');
	}

	/** Belső felolvasás metódus */
	#speakInternal(text: string, messageId: string): void {
		if (!this.#synthesis) {
			console.log('[TTS] Synthesis nem elérhető');
			return;
		}

		console.log('[TTS] Felolvasás indítása:', { text, messageId, enabled: this.enabled });

		// Először töröljük a várakozási sort (Chrome/Safari bug workaround)
		this.#synthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);

		// Hang kiválasztása
		if (this.selectedVoice) {
			const voices = this.#synthesis.getVoices();
			console.log('[TTS] Elérhető hangok:', voices.length);
			const voice = voices.find((v) => v.name === this.selectedVoice);
			if (voice) {
				console.log('[TTS] Kiválasztott hang:', voice.name);
				utterance.voice = voice;
			} else {
				console.log('[TTS] Hang nem található:', this.selectedVoice);
			}
		} else {
			console.log('[TTS] Nincs kiválasztott hang, alapértelmezett használata');
		}

		// Beállítások alkalmazása
		utterance.rate = this.rate;
		utterance.pitch = this.pitch;
		utterance.volume = this.volume;

		console.log('[TTS] Beállítások:', { rate: this.rate, pitch: this.pitch, volume: this.volume });

		// Event handlerek
		utterance.onstart = () => {
			console.log('[TTS] Felolvasás elkezdődött');
			this.status = 'speaking';
			this.currentMessageId = messageId;
		};

		utterance.onend = () => {
			console.log('[TTS] Felolvasás befejeződött');
			this.status = 'idle';
			this.currentMessageId = null;
			this.#currentUtterance = null;
		};

		utterance.onerror = (event) => {
			console.error('[TTS] Hiba:', event.error, event);
			this.status = 'idle';
			this.currentMessageId = null;
			this.#currentUtterance = null;
		};

		this.#currentUtterance = utterance;
		console.log('[TTS] speak() hívása...');

		// Kis késleltetés a böngésző számára (Chrome/Safari bug workaround)
		setTimeout(() => {
			if (this.#synthesis) {
				this.#synthesis.speak(utterance);
				console.log('[TTS] speak() meghívva');
			}
		}, 100);
	}

	/** Felolvasás szüneteltetése */
	pause(): void {
		if (!this.#synthesis || this.status !== 'speaking') return;
		this.#synthesis.pause();
		this.status = 'paused';
	}

	/** Felolvasás folytatása */
	resume(): void {
		if (!this.#synthesis || this.status !== 'paused') return;
		this.#synthesis.resume();
		this.status = 'speaking';
	}

	/** Felolvasás leállítása */
	stop(): void {
		if (!this.#synthesis) return;
		this.#synthesis.cancel();
		this.status = 'idle';
		this.currentMessageId = null;
		this.#currentUtterance = null;
	}

	/** Markdown formázás eltávolítása a szövegből */
	#cleanMarkdown(text: string): string {
		return (
			text
				// Kód blokkok eltávolítása
				.replace(/```[\s\S]*?```/g, '')
				// Inline kód eltávolítása
				.replace(/`[^`]+`/g, '')
				// Linkek (csak a szöveg marad)
				.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
				// Bold/italic
				.replace(/(\*\*|__)(.*?)\1/g, '$2')
				.replace(/(\*|_)(.*?)\1/g, '$2')
				// Headers
				.replace(/^#{1,6}\s+/gm, '')
				// Lista jelek
				.replace(/^[\*\-\+]\s+/gm, '')
				.replace(/^\d+\.\s+/gm, '')
				// Többszörös sortörések
				.replace(/\n{3,}/g, '\n\n')
				.trim()
		);
	}

	/** TTS támogatás ellenőrzése */
	get isSupported(): boolean {
		return this.#synthesis !== null;
	}
}

// Globális singleton példány
let globalTTSService: TTSService | null = null;

/** TTS service létrehozása vagy visszaadása */
export function createTTSService(): TTSService {
	if (!globalTTSService) {
		globalTTSService = new TTSService();
	}
	return globalTTSService;
}

/** TTS service lekérése */
export function getTTSService(): TTSService {
	if (!globalTTSService) {
		globalTTSService = new TTSService();
	}
	return globalTTSService;
}
