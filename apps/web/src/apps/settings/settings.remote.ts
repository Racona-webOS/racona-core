import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import type { UserSettings } from '$lib/types/settings';
import { DEFAULT_USER_SETTINGS } from '$lib/types/settings';
import { userRepository } from '$lib/server/database/repositories';

// Request validation schema
const updateSettingsSchema = v.object({
	preferPerformance: v.optional(v.boolean()),
	windowPreview: v.optional(v.boolean()),
	screenshotThumbnailHeight: v.optional(v.pipe(v.number(), v.minValue(100), v.maxValue(200))),
	background: v.optional(
		v.object({
			type: v.optional(v.picklist(['color', 'image', 'video'])),
			value: v.optional(v.string()),
			scope: v.optional(v.picklist(['shared', 'user'])),
			blur: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(30))),
			grayscale: v.optional(v.boolean())
		})
	),
	theme: v.optional(
		v.object({
			mode: v.optional(v.picklist(['light', 'dark', 'auto'])),
			modeTaskbarStartMenu: v.optional(v.picklist(['light', 'dark', 'auto'])),
			colorPrimaryHue: v.optional(v.string()),
			colorPrimaryLightness: v.optional(v.string()),
			colorPrimaryChroma: v.optional(v.string()),
			fontSize: v.optional(v.picklist(['small', 'medium', 'large']))
		})
	),
	taskbar: v.optional(
		v.object({
			position: v.optional(v.picklist(['top', 'bottom', 'left', 'right'])),
			style: v.optional(v.picklist(['classic', 'modern'])),
			itemVisibility: v.optional(v.record(v.string(), v.boolean()))
		})
	),
	startMenu: v.optional(
		v.object({
			viewMode: v.optional(v.picklist(['grid', 'list']))
		})
	),
	desktop: v.optional(
		v.object({
			clickMode: v.optional(v.picklist(['single', 'double']))
		})
	)
});

/**
 * Frissíti a felhasználói beállításokat.
 * @param updates - A frissítendő beállítások.
 * @returns A frissített beállítások objektum.
 */
export const updateSettings = command(updateSettingsSchema, async (updates) => {
	const event = getRequestEvent();
	const { locals } = event;

	// Ellenőrizzük, hogy be van-e jelentkezve a felhasználó
	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated',
			settings: locals.settings || DEFAULT_USER_SETTINGS
		};
	}

	const userId = parseInt(locals.user.id);

	// Adatbázisba mentjük a beállításokat a repository-n keresztül
	const result = await userRepository.patchUserSettings(userId, updates as Partial<UserSettings>);

	// Frissítjük a locals.settings-et is, hogy a jelenlegi request-ben is elérhető legyen
	locals.settings = result.settings;
	return result;
});
