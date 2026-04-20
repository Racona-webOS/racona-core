/**
 * TTS Settings Remote Actions
 *
 * Text-to-Speech beállítások mentése és betöltése az adatbázisból
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { userRepository } from '$lib/server/database/repositories';
import type { TTSSettings } from '$lib/types/settings';
import { DEFAULT_USER_SETTINGS } from '$lib/types/settings';

// -------------------------------------------------------------------------
// Validation Schemas
// -------------------------------------------------------------------------

const TTSSettingsSchema = v.object({
	enabled: v.boolean(),
	autoPlay: v.boolean(),
	rate: v.pipe(v.number(), v.minValue(0.1), v.maxValue(10)),
	pitch: v.pipe(v.number(), v.minValue(0), v.maxValue(2)),
	volume: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	selectedVoice: v.nullable(v.string())
});

// -------------------------------------------------------------------------
// Query: TTS beállítások lekérése
// -------------------------------------------------------------------------

export const getTTSSettings = query(async () => {
	const { locals } = getRequestEvent();

	if (!locals.session?.userId) {
		return {
			success: false,
			error: 'User not authenticated',
			settings: DEFAULT_USER_SETTINGS.tts
		};
	}

	const userId = parseInt(locals.session.userId);

	try {
		const userSettings = await userRepository.getUserSettings(userId);

		return {
			success: true,
			settings: userSettings.tts || DEFAULT_USER_SETTINGS.tts
		};
	} catch (error) {
		console.error('[getTTSSettings] Error:', error);
		return {
			success: false,
			error: 'Failed to load TTS settings',
			settings: DEFAULT_USER_SETTINGS.tts
		};
	}
});

// -------------------------------------------------------------------------
// Command: TTS beállítások mentése
// -------------------------------------------------------------------------

export const saveTTSSettings = command(TTSSettingsSchema, async (settings: TTSSettings) => {
	const { locals } = getRequestEvent();

	if (!locals.session?.userId) {
		return {
			success: false,
			error: 'User not authenticated'
		};
	}

	const userId = parseInt(locals.session.userId);

	try {
		// Lekérjük a jelenlegi beállításokat
		const currentSettings = await userRepository.getUserSettings(userId);

		// Frissítjük a TTS beállításokat
		const updatedSettings = {
			...currentSettings,
			tts: settings
		};

		// Mentjük az adatbázisba
		const result = await userRepository.updateUserSettings(userId, updatedSettings);

		if (result.success) {
			// Frissítjük a locals-t is
			locals.settings = result.settings;

			return {
				success: true,
				settings: result.settings.tts
			};
		} else {
			return {
				success: false,
				error: 'Failed to save TTS settings'
			};
		}
	} catch (error) {
		console.error('[saveTTSSettings] Error:', error);
		return {
			success: false,
			error: 'Failed to save TTS settings'
		};
	}
});
