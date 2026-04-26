/**
 * Text-to-Speech service — Web Speech API + ElevenLabs támogatás
 * Admin config (globális default) + User settings (felülbírálások)
 */

import type { TTSSettings } from '$lib/types/settings';
import type { AIAssistantConfig } from '@webos/database';

export type TTSVoice = {
	name: string;
	lang: string;
	default: boolean;
};

export type ElevenLabsVoice = {
	voice_id: string;
	name: string;
	category: string;
};

export type TTSStatus = 'idle' | 'speaking' | 'paused';
export type TTSProvider = 'browser' | 'elevenlabs';

class TTSService {
	#synthesis: SpeechSynthesis | null = null;
	#currentUtterance: SpeechSynthesisUtterance | null = null;
	#currentAudio: HTMLAudioElement | null = null;

	status = $state<TTSStatus>('idle');
	availableVoices = $state<TTSVoice[]>([]);
	elevenLabsVoices = $state<ElevenLabsVoice[]>([]);
	currentMessageId = $state<string | null>(null);

	// Admin config (globális default)
	#adminProvider = $state<TTSProvider>('browser');
	#adminApiKey = $state<string | undefined>(undefined);
	#adminVoiceId = $state<string | undefined>(undefined);
	#adminLanguage = $state<string>('en');
	isGloballyEnabled = $state(true); // TTS Provider globális engedélyezése (admin beállítás)

	// User settings (felülbírálások)
	userEnabled = $state(true); // User-level engedélyezés (felülbírálhatja az admin beállítást)
	autoPlay = $state(false);
	rate = $state(1.0);
	pitch = $state(1.0);
	volume = $state(1.0);
	selectedVoiceOverride = $state<string | null>(null);

	// Derived: TTS ténylegesen engedélyezve van-e (admin ÉS user is engedélyezte)
	isEnabled = $derived(this.isGloballyEnabled && this.userEnabled);

	// Derived values (merge admin + user)
	provider = $derived(this.#adminProvider);
	elevenLabsApiKey = $derived(this.#adminApiKey);
	elevenLabsVoiceId = $derived(this.selectedVoiceOverride || this.#adminVoiceId);
	selectedVoice = $derived(this.selectedVoiceOverride || this.#getDefaultVoice());

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

	/** Elérhető hangok betöltése (Web Speech API) */
	#loadVoices(): void {
		if (!this.#synthesis) return;

		const voices = this.#synthesis.getVoices();
		this.availableVoices = voices.map((v) => ({
			name: v.name,
			lang: v.lang,
			default: v.default
		}));
	}

	/** Default hang meghatározása (admin language alapján) */
	#getDefaultVoice(): string | null {
		if (this.availableVoices.length === 0) return null;

		// Admin language alapján keresünk hangot
		const langPrefix = this.#adminLanguage.split('-')[0]; // 'hu-HU' -> 'hu'
		const matchingVoice = this.availableVoices.find((v) => v.lang.startsWith(langPrefix));

		return matchingVoice?.name || this.availableVoices[0]?.name || null;
	}

	/** ElevenLabs hangok betöltése */
	async loadElevenLabsVoices(): Promise<void> {
		if (!this.#adminApiKey) {
			console.log('[TTS] ElevenLabs API kulcs hiányzik');
			return;
		}

		try {
			const response = await fetch('https://api.elevenlabs.io/v1/voices', {
				headers: {
					'xi-api-key': this.#adminApiKey
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();

			// Csak a pre-made (nem library/cloned) hangokat szűrjük ki
			this.elevenLabsVoices = data.voices
				.filter((v: any) => v.category === 'premade' || v.category === 'generated')
				.map((v: any) => ({
					voice_id: v.voice_id,
					name: v.name,
					category: v.category || 'premade'
				}));

			console.log(
				'[TTS] ElevenLabs hangok betöltve (csak ingyenes):',
				this.elevenLabsVoices.length
			);
		} catch (err) {
			console.error('[TTS] ElevenLabs hangok betöltése sikertelen:', err);
		}
	}

	/** Admin config betöltése (globális default beállítások) */
	loadAdminConfig(config: AIAssistantConfig['ttsProvider']): void {
		this.#adminProvider = config.provider as TTSProvider;
		this.#adminApiKey = config.apiKeyEncrypted;
		this.#adminVoiceId = config.voiceId;
		this.#adminLanguage = config.language || 'en';
		this.isGloballyEnabled = config.enabled ?? true;

		console.log('[TTS] Admin config betöltve:', {
			provider: this.#adminProvider,
			hasApiKey: !!this.#adminApiKey,
			voiceId: this.#adminVoiceId,
			language: this.#adminLanguage,
			enabled: this.isGloballyEnabled
		});

		// ElevenLabs hangok betöltése, ha van API kulcs
		if (this.#adminProvider === 'elevenlabs' && this.#adminApiKey) {
			this.loadElevenLabsVoices();
		}
	}

	/** User settings betöltése (felülbírálások) */
	loadUserSettings(settings: TTSSettings): void {
		this.userEnabled = settings.enabled ?? true;
		this.autoPlay = settings.autoPlay;
		this.rate = settings.rate;
		this.pitch = settings.pitch;
		this.volume = settings.volume;
		this.selectedVoiceOverride = settings.selectedVoiceOverride ?? null;

		console.log('[TTS] User settings betöltve:', {
			enabled: this.userEnabled,
			autoPlay: this.autoPlay,
			rate: this.rate,
			pitch: this.pitch,
			volume: this.volume,
			voiceOverride: this.selectedVoiceOverride
		});
	}

	/** Aktuális user settings lekérése */
	getUserSettings(): TTSSettings {
		return {
			enabled: this.userEnabled,
			autoPlay: this.autoPlay,
			rate: this.rate,
			pitch: this.pitch,
			volume: this.volume,
			selectedVoiceOverride: this.selectedVoiceOverride
		};
	}

	/** Szöveg felolvasása */
	speak(text: string, messageId: string): void {
		if (!this.isEnabled) return;

		// Ha már beszél, állítsuk le
		if (this.status === 'speaking') {
			this.stop();
		}

		// Markdown formázás eltávolítása
		const cleanText = this.#cleanMarkdown(text);

		if (this.provider === 'elevenlabs') {
			this.#speakElevenLabs(cleanText, messageId);
		} else {
			this.#speakBrowser(cleanText, messageId);
		}
	}

	/** Teszt felolvasás (mindig működik, függetlenül az enabled beállítástól) */
	speakTest(text: string): void {
		// Ha már beszél, állítsuk le
		if (this.status === 'speaking') {
			this.stop();
		}

		if (this.provider === 'elevenlabs') {
			this.#speakElevenLabs(text, 'test-message');
		} else {
			this.#speakBrowser(text, 'test-message');
		}
	}

	/** Böngésző TTS felolvasás */
	#speakBrowser(text: string, messageId: string): void {
		if (!this.#synthesis) {
			console.log('[TTS] Synthesis nem elérhető');
			return;
		}

		console.log('[TTS] Browser felolvasás indítása:', { text, messageId });

		// Először töröljük a várakozási sort (Chrome/Safari bug workaround)
		this.#synthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);

		// Hang kiválasztása (user override vagy admin default)
		if (this.selectedVoice) {
			const voices = this.#synthesis.getVoices();
			const voice = voices.find((v) => v.name === this.selectedVoice);
			if (voice) {
				utterance.voice = voice;
			}
		}

		// Beállítások alkalmazása
		utterance.rate = this.rate;
		utterance.pitch = this.pitch;
		utterance.volume = this.volume;

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

		// Kis késleltetés a böngésző számára (Chrome/Safari bug workaround)
		setTimeout(() => {
			if (this.#synthesis) {
				this.#synthesis.speak(utterance);
			}
		}, 100);
	}

	/** ElevenLabs TTS felolvasás */
	async #speakElevenLabs(text: string, messageId: string): Promise<void> {
		if (!this.elevenLabsApiKey || !this.elevenLabsVoiceId) {
			console.error('[TTS] ElevenLabs API kulcs vagy voice ID hiányzik');
			return;
		}

		console.log('[TTS] ElevenLabs felolvasás indítása:', { text, messageId });

		this.status = 'speaking';
		this.currentMessageId = messageId;

		try {
			const response = await fetch(
				`https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
				{
					method: 'POST',
					headers: {
						Accept: 'audio/mpeg',
						'Content-Type': 'application/json',
						'xi-api-key': this.elevenLabsApiKey
					},
					body: JSON.stringify({
						text,
						model_id: 'eleven_multilingual_v2',
						voice_settings: {
							stability: 0.5,
							similarity_boost: 0.75,
							style: 0.0,
							use_speaker_boost: true
						}
					})
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${await response.text()}`);
			}

			const audioBlob = await response.blob();
			const audioUrl = URL.createObjectURL(audioBlob);

			// Audio elem létrehozása és lejátszása
			this.#currentAudio = new Audio(audioUrl);
			this.#currentAudio.volume = this.volume;

			this.#currentAudio.onended = () => {
				console.log('[TTS] ElevenLabs felolvasás befejeződött');
				this.status = 'idle';
				this.currentMessageId = null;
				URL.revokeObjectURL(audioUrl);
				this.#currentAudio = null;
			};

			this.#currentAudio.onerror = (err) => {
				console.error('[TTS] ElevenLabs lejátszási hiba:', err);
				this.status = 'idle';
				this.currentMessageId = null;
				URL.revokeObjectURL(audioUrl);
				this.#currentAudio = null;
			};

			await this.#currentAudio.play();
			console.log('[TTS] ElevenLabs lejátszás elkezdődött');
		} catch (err) {
			console.error('[TTS] ElevenLabs hiba:', err);
			this.status = 'idle';
			this.currentMessageId = null;
		}
	}

	/** Felolvasás szüneteltetése */
	pause(): void {
		if (this.status !== 'speaking') return;

		if (this.provider === 'browser' && this.#synthesis) {
			this.#synthesis.pause();
			this.status = 'paused';
		} else if (this.provider === 'elevenlabs' && this.#currentAudio) {
			this.#currentAudio.pause();
			this.status = 'paused';
		}
	}

	/** Felolvasás folytatása */
	resume(): void {
		if (this.status !== 'paused') return;

		if (this.provider === 'browser' && this.#synthesis) {
			this.#synthesis.resume();
			this.status = 'speaking';
		} else if (this.provider === 'elevenlabs' && this.#currentAudio) {
			this.#currentAudio.play();
			this.status = 'speaking';
		}
	}

	/** Felolvasás leállítása */
	stop(): void {
		if (this.provider === 'browser' && this.#synthesis) {
			this.#synthesis.cancel();
		}

		if (this.#currentAudio) {
			this.#currentAudio.pause();
			this.#currentAudio = null;
		}

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
		if (this.provider === 'elevenlabs') {
			return !!this.elevenLabsApiKey;
		}
		return this.#synthesis !== null;
	}

	/** Globális TTS engedélyezettség frissítése */
	setGloballyEnabled(enabled: boolean): void {
		this.isGloballyEnabled = enabled;
		console.log('[TTS] Globális engedélyezettség frissítve:', enabled);
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
