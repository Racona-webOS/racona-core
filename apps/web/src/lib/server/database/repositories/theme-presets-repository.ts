import db from '../index';
import { themePresets } from '@racona/database/schemas';
import { eq, and, asc } from 'drizzle-orm';

export const themePresetsRepository = {
	/**
	 * Lekéri az összes témát az adatbázisból a megadott locale szerint.
	 * @param locale - A nyelv kódja (pl. 'hu', 'en')
	 * @returns Az adott nyelvhez tartozó témák.
	 */
	async getAll(locale: string) {
		try {
			const presets = await db
				.select()
				.from(themePresets)
				.where(eq(themePresets.locale, locale))
				.orderBy(asc(themePresets.sortOrder), asc(themePresets.name));
			return presets;
		} catch (error) {
			console.error('Failed to fetch theme presets:', error);
			throw new Error('Failed to fetch theme presets');
		}
	},

	/**
	 * Lekéri az alapértelmezett témát a megadott locale szerint.
	 * @param locale - A nyelv kódja
	 * @returns Az alapértelmezett téma vagy null.
	 */
	async getDefault(locale: string) {
		try {
			const preset = await db
				.select()
				.from(themePresets)
				.where(and(eq(themePresets.isDefault, true), eq(themePresets.locale, locale)))
				.limit(1);
			return preset[0] || null;
		} catch (error) {
			console.error('Failed to fetch default theme preset:', error);
			throw new Error('Failed to fetch default theme preset');
		}
	}
};
