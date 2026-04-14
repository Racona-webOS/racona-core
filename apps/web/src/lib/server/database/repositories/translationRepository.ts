/**
 * Translation Repository
 *
 * Adatbázis műveletek a fordításokhoz.
 * CRUD műveletek és bulk upsert támogatás.
 *
 * Requirements: 4.2, 4.5
 */

import db from '$lib/server/database';
import { eq, and, like } from 'drizzle-orm';
import { translations } from '@racona/database/schemas';
import type { CreateTranslationInput, TranslationEntry } from '$lib/i18n/types';

/**
 * Translation Repository osztály
 *
 * Kezeli az adatbázis fordítások CRUD műveleteit.
 */
export class TranslationRepository {
	/**
	 * Fordítás lekérése kulcs alapján
	 *
	 * @param locale - Nyelv kódja
	 * @param namespace - Namespace neve
	 * @param key - Fordítási kulcs
	 * @returns A fordítás bejegyzés vagy null
	 */
	async getByKey(locale: string, namespace: string, key: string): Promise<TranslationEntry | null> {
		const result = await db.query.translations.findFirst({
			where: and(
				eq(translations.locale, locale),
				eq(translations.namespace, namespace),
				eq(translations.key, key)
			)
		});

		if (!result) {
			return null;
		}

		return this.mapToTranslationEntry(result);
	}

	/**
	 * Összes fordítás lekérése egy namespace-hez
	 *
	 * @param locale - Nyelv kódja
	 * @param namespace - Namespace neve
	 * @returns Fordítás bejegyzések tömbje
	 */
	async getByNamespace(locale: string, namespace: string): Promise<TranslationEntry[]> {
		const results = await db.query.translations.findMany({
			where: and(eq(translations.locale, locale), eq(translations.namespace, namespace))
		});

		return results.map((r) => this.mapToTranslationEntry(r));
	}

	/**
	 * Új fordítás létrehozása
	 *
	 * @param input - Létrehozási adatok
	 * @returns A létrehozott fordítás bejegyzés
	 */
	async create(input: CreateTranslationInput): Promise<TranslationEntry> {
		const [result] = await db
			.insert(translations)
			.values({
				locale: input.locale,
				namespace: input.namespace,
				key: input.key,
				value: input.value
			})
			.returning();

		return this.mapToTranslationEntry(result);
	}

	/**
	 * Fordítás frissítése
	 *
	 * @param id - Fordítás azonosítója
	 * @param value - Új érték
	 * @returns A frissített fordítás bejegyzés
	 */
	async update(id: number, value: string): Promise<TranslationEntry> {
		const [result] = await db
			.update(translations)
			.set({
				value,
				updatedAt: new Date()
			})
			.where(eq(translations.id, id))
			.returning();

		if (!result) {
			throw new Error(`Translation with id ${id} not found`);
		}

		return this.mapToTranslationEntry(result);
	}

	/**
	 * Fordítás törlése
	 *
	 * @param id - Fordítás azonosítója
	 */
	async delete(id: number): Promise<void> {
		await db.delete(translations).where(eq(translations.id, id));
	}

	/**
	 * Tömeges upsert művelet.
	 *
	 * Ha a fordítás már létezik (locale + namespace + key alapján),
	 * frissíti az értéket. Ha nem létezik, létrehozza.
	 *
	 * @param entries - Fordítás bejegyzések tömbje
	 * @returns A sikeresen feldolgozott bejegyzések száma
	 */
	async bulkUpsert(entries: CreateTranslationInput[]): Promise<number> {
		if (entries.length === 0) {
			return 0;
		}

		let processedCount = 0;

		// Egyenként dolgozzuk fel az upsert műveleteket
		for (const entry of entries) {
			const existing = await this.getByKey(entry.locale, entry.namespace, entry.key);

			if (existing) {
				await this.update(existing.id, entry.value);
			} else {
				await this.create(entry);
			}
			processedCount++;
		}

		return processedCount;
	}

	/**
	 * Fordítási kulcsok keresése
	 *
	 * @param query - Keresési kifejezés
	 * @param locale - Opcionális nyelv szűrő
	 * @returns Találatok tömbje
	 */
	async searchKeys(query: string, locale?: string): Promise<TranslationEntry[]> {
		const conditions = [like(translations.key, `%${query}%`)];

		if (locale) {
			conditions.push(eq(translations.locale, locale));
		}

		const results = await db.query.translations.findMany({
			where: and(...conditions)
		});

		return results.map((r) => this.mapToTranslationEntry(r));
	}

	/**
	 * Hiányzó fordítások lekérése
	 *
	 * Összehasonlítja a referencia locale fordításait a cél locale-lal,
	 * és visszaadja a hiányzó kulcsokat.
	 *
	 * @param locale - Cél nyelv kódja
	 * @param referenceLocale - Referencia nyelv kódja
	 * @returns Hiányzó kulcsok tömbje
	 */
	async getMissingTranslations(locale: string, referenceLocale: string): Promise<string[]> {
		// Referencia locale összes kulcsa
		const referenceKeys = await db.query.translations.findMany({
			where: eq(translations.locale, referenceLocale),
			columns: {
				namespace: true,
				key: true
			}
		});

		// Cél locale összes kulcsa
		const targetKeys = await db.query.translations.findMany({
			where: eq(translations.locale, locale),
			columns: {
				namespace: true,
				key: true
			}
		});

		// Kulcsok halmazba konvertálása
		const targetKeySet = new Set(targetKeys.map((t) => `${t.namespace}:${t.key}`));

		// Hiányzó kulcsok megkeresése
		const missingKeys: string[] = [];
		for (const ref of referenceKeys) {
			const fullKey = `${ref.namespace}:${ref.key}`;
			if (!targetKeySet.has(fullKey)) {
				missingKeys.push(fullKey);
			}
		}

		return missingKeys;
	}

	/**
	 * Fordítások lekérése Record formátumban
	 *
	 * Ez a metódus a loader számára készült, hogy közvetlenül
	 * használható formátumban adja vissza a fordításokat.
	 *
	 * @param locale - Nyelv kódja
	 * @param namespace - Namespace neve
	 * @returns Kulcs-érték párok objektuma
	 */
	async getAsRecord(locale: string, namespace: string): Promise<Record<string, string>> {
		const results = await this.getByNamespace(locale, namespace);

		const record: Record<string, string> = {};
		for (const entry of results) {
			record[entry.key] = entry.value;
		}

		return record;
	}

	/**
	 * Adatbázis eredmény konvertálása TranslationEntry típusra
	 */
	private mapToTranslationEntry(result: typeof translations.$inferSelect): TranslationEntry {
		return {
			id: result.id,
			locale: result.locale,
			namespace: result.namespace,
			key: result.key,
			value: result.value,
			createdAt: result.createdAt ?? new Date(),
			updatedAt: result.updatedAt ?? new Date()
		};
	}
}

// Singleton instance
export const translationRepository = new TranslationRepository();
