/**
 * Property-Based Tests for Plural Utility
 *
 * Feature: multi-language-support
 * Property 15: Többes szám kezelés
 *
 * _Bármely_ plural fordítás és szám esetén a tc() függvény
 * a számnak megfelelő formát adja vissza (=0, one, other).
 *
 * **Validates: Requirements 7.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	formatPlural,
	formatPluralSimple,
	getPluralCategory,
	hasPlural,
	type PluralCategory
} from '../plural.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// Arbitrary for supported locales
const localeArb = fc.constantFrom('hu', 'en');

// Arbitrary for non-negative integers (most common use case for counts)
const countArb = fc.integer({ min: 0, max: 1000000 });

// Arbitrary for any integer (including negative)
const anyCountArb = fc.integer({ min: -1000000, max: 1000000 });

// Arbitrary for plain text without special characters
const plainTextArb = fc.string({ minLength: 0, maxLength: 50 }).map((s) => s.replace(/[{}#]/g, ''));

describe('Plural - Property 15: Többes szám kezelés', () => {
	/**
	 * Property 15a: Zero count returns =0 or zero category text
	 *
	 * When count is 0, the plural formatter should return the =0 exact match
	 * or the zero category text.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should return =0 or zero category text for count 0', () => {
		fc.assert(
			fc.property(
				localeArb,
				plainTextArb,
				plainTextArb,
				plainTextArb,
				(locale, zeroText, oneText, otherText) => {
					const text = `{count, plural, =0 {${zeroText}} one {${oneText}} other {${otherText}}}`;
					const result = formatPlural(text, { count: 0 }, locale);

					expect(result).toBe(zeroText);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 15b: Count of 1 returns one category text
	 *
	 * When count is 1, the plural formatter should return the one category text.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should return one category text for count 1', () => {
		fc.assert(
			fc.property(
				localeArb,
				plainTextArb,
				plainTextArb,
				plainTextArb,
				(locale, zeroText, oneText, otherText) => {
					const text = `{count, plural, =0 {${zeroText}} one {${oneText}} other {${otherText}}}`;
					const result = formatPlural(text, { count: 1 }, locale);

					expect(result).toBe(oneText);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 15c: Count > 1 returns other category text
	 *
	 * When count is greater than 1, the plural formatter should return the other category text.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should return other category text for count > 1', () => {
		fc.assert(
			fc.property(
				localeArb,
				plainTextArb,
				plainTextArb,
				plainTextArb,
				fc.integer({ min: 2, max: 1000000 }),
				(locale, zeroText, oneText, otherText, count) => {
					const text = `{count, plural, =0 {${zeroText}} one {${oneText}} other {${otherText}}}`;
					const result = formatPlural(text, { count }, locale);

					expect(result).toBe(otherText);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 15d: Exact match takes precedence over category
	 *
	 * When an exact match (=N) exists for a count, it should be used
	 * instead of the category match.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should prefer exact match over category match', () => {
		fc.assert(
			fc.property(
				localeArb,
				fc.integer({ min: 0, max: 100 }),
				plainTextArb,
				plainTextArb,
				(locale, exactCount, exactText, categoryText) => {
					// Create text with both exact match and category
					const text = `{count, plural, =${exactCount} {${exactText}} other {${categoryText}}}`;
					const result = formatPlural(text, { count: exactCount }, locale);

					expect(result).toBe(exactText);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 15e: # placeholder is replaced with count value
	 *
	 * When the selected text contains #, it should be replaced with the actual count.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should replace # placeholder with count value', () => {
		fc.assert(
			fc.property(localeArb, countArb, plainTextArb, (locale, count, suffix) => {
				const text = `{count, plural, =0 {no items} one {# item${suffix}} other {# items${suffix}}}`;
				const result = formatPlural(text, { count }, locale);

				if (count === 0) {
					expect(result).toBe('no items');
				} else if (count === 1) {
					expect(result).toBe(`1 item${suffix}`);
				} else {
					expect(result).toBe(`${count} items${suffix}`);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 15f: Multiple # placeholders are all replaced
	 *
	 * When the selected text contains multiple # placeholders,
	 * all of them should be replaced with the count.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should replace all # placeholders with count value', () => {
		fc.assert(
			fc.property(localeArb, fc.integer({ min: 2, max: 1000 }), (locale, count) => {
				const text = `{count, plural, other {# items, total: #}}`;
				const result = formatPlural(text, { count }, locale);

				expect(result).toBe(`${count} items, total: ${count}`);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 15g: Negative counts use absolute value for category
	 *
	 * When count is negative, the absolute value should be used
	 * for determining the plural category.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should use absolute value for plural category with negative counts', () => {
		fc.assert(
			fc.property(localeArb, fc.integer({ min: -1000000, max: -2 }), (locale, negativeCount) => {
				const category = getPluralCategory(negativeCount, locale);

				// Absolute value > 1 should give 'other' category
				expect(category).toBe('other');
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 15h: formatPluralSimple produces same result as formatPlural
	 *
	 * The simplified formatPluralSimple function should produce
	 * the same result as formatPlural with { count: n }.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should produce same result with formatPluralSimple as formatPlural', () => {
		fc.assert(
			fc.property(
				localeArb,
				countArb,
				plainTextArb,
				plainTextArb,
				plainTextArb,
				(locale, count, zeroText, oneText, otherText) => {
					const text = `{count, plural, =0 {${zeroText}} one {${oneText}} other {${otherText}}}`;

					const resultFull = formatPlural(text, { count }, locale);
					const resultSimple = formatPluralSimple(text, count, locale);

					expect(resultSimple).toBe(resultFull);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 15i: Fallback to 'other' when category not defined
	 *
	 * When a specific category is not defined in the plural options,
	 * the formatter should fall back to 'other'.
	 *
	 * **Validates: Requirements 7.2**
	 */
	it('should fallback to other when specific category not defined', () => {
		fc.assert(
			fc.property(localeArb, plainTextArb, (locale, otherText) => {
				// Only define 'other', no 'one' or 'zero'
				const text = `{count, plural, other {${otherText}}}`;

				// All counts should use 'other'
				expect(formatPlural(text, { count: 0 }, locale)).toBe(otherText);
				expect(formatPlural(text, { count: 1 }, locale)).toBe(otherText);
				expect(formatPlural(text, { count: 5 }, locale)).toBe(otherText);

				return true;
			}),
			testConfig
		);
	});
});

describe('Plural Helper Functions', () => {
	/**
	 * getPluralCategory returns correct category for all counts
	 */
	it('should return correct plural category for any count', () => {
		fc.assert(
			fc.property(localeArb, countArb, (locale, count) => {
				const category = getPluralCategory(count, locale);

				// Verify category is valid
				const validCategories: PluralCategory[] = ['zero', 'one', 'two', 'few', 'many', 'other'];
				expect(validCategories).toContain(category);

				// Verify category matches expected for hu/en rules
				if (count === 0) {
					expect(category).toBe('zero');
				} else if (count === 1) {
					expect(category).toBe('one');
				} else {
					expect(category).toBe('other');
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * hasPlural correctly detects plural patterns
	 */
	it('should correctly detect presence of plural patterns', () => {
		fc.assert(
			fc.property(plainTextArb, plainTextArb, (zeroText, otherText) => {
				// Text with plural pattern should return true
				const textWithPlural = `{count, plural, =0 {${zeroText}} other {${otherText}}}`;
				expect(hasPlural(textWithPlural)).toBe(true);

				// Plain text should return false
				const plainText = `Hello world ${zeroText}`;
				expect(hasPlural(plainText)).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Unknown locale falls back to default rules
	 */
	it('should use default rules for unknown locales', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 2, maxLength: 5 }).filter((s) => s !== 'hu' && s !== 'en'),
				countArb,
				(unknownLocale, count) => {
					const category = getPluralCategory(count, unknownLocale);

					// Should still return valid category using default rules
					if (count === 0) {
						expect(category).toBe('zero');
					} else if (count === 1) {
						expect(category).toBe('one');
					} else {
						expect(category).toBe('other');
					}

					return true;
				}
			),
			testConfig
		);
	});
});
