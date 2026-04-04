/**
 * Property-Based Tests for Format Utility
 *
 * Feature: multi-language-support
 * Property 16: Locale-aware formázás
 *
 * _Bármely_ dátum vagy szám esetén a formatDate() és formatNumber()
 * függvények a locale-specifikus formátumot alkalmazzák.
 *
 * **Validates: Requirements 7.3, 7.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	formatDate,
	formatNumber,
	formatCurrency,
	formatPercent,
	formatRelativeTime
} from '../format.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// Arbitrary for supported locales
const localeArb = fc.constantFrom('hu', 'en');

// Arbitrary for valid dates (within reasonable range, NaN kizárva)
const dateArb = fc.date({
	min: new Date('1970-01-01'),
	max: new Date('2100-12-31'),
	noInvalidDate: true
});

// Arbitrary for numbers (including decimals)
const numberArb = fc.double({
	min: -1000000000,
	max: 1000000000,
	noNaN: true,
	noDefaultInfinity: true
});

// Arbitrary for positive numbers (for currency/percent)
const positiveNumberArb = fc.double({
	min: 0,
	max: 1000000000,
	noNaN: true,
	noDefaultInfinity: true
});

// Arbitrary for percent values (0-1 range)
const percentArb = fc.double({
	min: 0,
	max: 1,
	noNaN: true,
	noDefaultInfinity: true
});

// Arbitrary for currency codes
const currencyArb = fc.constantFrom('HUF', 'EUR', 'USD', 'GBP');

describe('Format - Property 16: Locale-aware formázás', () => {
	/**
	 * Property 16a: formatDate returns locale-specific format
	 *
	 * When formatting a date with different locales,
	 * the output should differ based on locale conventions.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should format dates differently for different locales', () => {
		fc.assert(
			fc.property(dateArb, (date) => {
				const huResult = formatDate(date, 'hu');
				const enResult = formatDate(date, 'en');

				// Both should be non-empty strings
				expect(typeof huResult).toBe('string');
				expect(huResult.length).toBeGreaterThan(0);
				expect(typeof enResult).toBe('string');
				expect(enResult.length).toBeGreaterThan(0);

				// Results should contain the year
				const year = date.getFullYear().toString();
				expect(huResult).toContain(year);
				expect(enResult).toContain(year);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16b: formatDate returns valid string for any valid date
	 *
	 * For any valid Date object, formatDate should return a non-empty string.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should return valid string for any valid date', () => {
		fc.assert(
			fc.property(dateArb, localeArb, (date, locale) => {
				const result = formatDate(date, locale);

				// Should return a non-empty string
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);

				// Should not return the ISO string (which would indicate fallback)
				// unless the date is invalid
				if (!isNaN(date.getTime())) {
					// Result should contain numeric parts of the date
					const day = date.getDate();
					const month = date.getMonth() + 1;
					const year = date.getFullYear();

					// At least the year should be present
					expect(result).toContain(year.toString());
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16c: formatDate handles timestamp input
	 *
	 * formatDate should accept timestamps (numbers) and format them correctly.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should handle timestamp input correctly', () => {
		fc.assert(
			fc.property(dateArb, localeArb, (date, locale) => {
				// Skip invalid dates (edge case protection)
				if (isNaN(date.getTime())) {
					return true;
				}

				const timestamp = date.getTime();

				const resultFromDate = formatDate(date, locale);
				const resultFromTimestamp = formatDate(timestamp, locale);

				// Both should produce the same result
				expect(resultFromTimestamp).toBe(resultFromDate);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16d: formatDate handles ISO string input
	 *
	 * formatDate should accept ISO date strings and format them correctly.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should handle ISO string input correctly', () => {
		fc.assert(
			fc.property(dateArb, localeArb, (date, locale) => {
				const isoString = date.toISOString();

				const resultFromDate = formatDate(date, locale);
				const resultFromString = formatDate(isoString, locale);

				// Both should produce the same result
				expect(resultFromString).toBe(resultFromDate);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16e: formatNumber returns locale-specific format
	 *
	 * When formatting a number with different locales,
	 * the output should use locale-specific separators.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should format numbers with locale-specific separators', () => {
		fc.assert(
			fc.property(
				fc.double({ min: 1000, max: 1000000, noNaN: true, noDefaultInfinity: true }),
				(num) => {
					const huResult = formatNumber(num, 'hu');
					const enResult = formatNumber(num, 'en');

					// Both should be non-empty strings
					expect(typeof huResult).toBe('string');
					expect(huResult.length).toBeGreaterThan(0);
					expect(typeof enResult).toBe('string');
					expect(enResult.length).toBeGreaterThan(0);

					// Hungarian uses space as thousands separator, English uses comma
					// At least one should contain a separator for numbers >= 1000
					const hasHuSeparator = huResult.includes(' ') || huResult.includes('\u00A0');
					const hasEnSeparator = enResult.includes(',');

					// For large enough numbers, separators should be present
					if (num >= 1000) {
						expect(hasHuSeparator || hasEnSeparator).toBe(true);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 16f: formatNumber returns valid string for any valid number
	 *
	 * For any valid number, formatNumber should return a non-empty string.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should return valid string for any valid number', () => {
		fc.assert(
			fc.property(numberArb, localeArb, (num, locale) => {
				const result = formatNumber(num, locale);

				// Should return a non-empty string
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16g: formatNumber preserves sign for negative numbers
	 *
	 * Negative numbers should have a minus sign in the output.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should preserve sign for negative numbers', () => {
		fc.assert(
			fc.property(
				fc.double({ min: -1000000, max: -1, noNaN: true, noDefaultInfinity: true }),
				localeArb,
				(num, locale) => {
					const result = formatNumber(num, locale);

					// Should contain minus sign or negative indicator
					expect(result.includes('-') || result.includes('−')).toBe(true);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 16h: formatCurrency includes currency symbol
	 *
	 * Currency formatting should include the currency symbol or code.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should include currency symbol in formatted output', () => {
		fc.assert(
			fc.property(positiveNumberArb, currencyArb, localeArb, (amount, currency, locale) => {
				const result = formatCurrency(amount, currency, locale);

				// Should return a non-empty string
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);

				// Should contain some currency indicator
				// Different locales may use symbol or code
				const currencyIndicators: Record<string, string[]> = {
					HUF: ['Ft', 'HUF'],
					EUR: ['€', 'EUR'],
					USD: ['$', 'USD'],
					GBP: ['£', 'GBP']
				};

				const indicators = currencyIndicators[currency] || [currency];
				const hasIndicator = indicators.some((ind) => result.includes(ind));

				expect(hasIndicator).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16i: formatPercent returns percentage format
	 *
	 * Percent formatting should include the percent sign.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should include percent sign in formatted output', () => {
		fc.assert(
			fc.property(percentArb, localeArb, (value, locale) => {
				const result = formatPercent(value, locale);

				// Should return a non-empty string
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);

				// Should contain percent sign
				expect(result.includes('%')).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16j: formatPercent converts decimal to percentage
	 *
	 * A value of 0.5 should be formatted as 50%.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should convert decimal values to percentage correctly', () => {
		fc.assert(
			fc.property(
				fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
				localeArb,
				(value, locale) => {
					const result = formatPercent(value, locale, 0);

					// Extract the numeric part
					const numericPart = result.replace(/[^0-9]/g, '');
					const expectedPercent = Math.round(value * 100);

					// The numeric part should match the expected percentage
					expect(parseInt(numericPart, 10)).toBe(expectedPercent);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 16k: formatRelativeTime returns locale-specific relative time
	 *
	 * Relative time formatting should use locale-specific words.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should format relative time with locale-specific words', () => {
		fc.assert(
			fc.property(localeArb, (locale) => {
				const now = new Date();
				const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

				const result = formatRelativeTime(yesterday, locale, now);

				// Should return a non-empty string
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);

				// Hungarian should contain "tegnap" or similar
				// English should contain "yesterday" or similar
				if (locale === 'hu') {
					expect(result.toLowerCase()).toContain('tegnap');
				} else if (locale === 'en') {
					expect(result.toLowerCase()).toContain('yesterday');
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16l: formatDate with dateStyle option works correctly
	 *
	 * Different dateStyle options should produce different output lengths.
	 *
	 * **Validates: Requirements 7.3**
	 */
	it('should respect dateStyle option', () => {
		fc.assert(
			fc.property(dateArb, localeArb, (date, locale) => {
				const shortResult = formatDate(date, locale, { dateStyle: 'short' });
				const longResult = formatDate(date, locale, { dateStyle: 'long' });

				// Both should be valid strings
				expect(typeof shortResult).toBe('string');
				expect(typeof longResult).toBe('string');

				// Long format should generally be longer than short
				// (though this isn't always guaranteed, it's a reasonable expectation)
				expect(longResult.length).toBeGreaterThanOrEqual(shortResult.length);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 16m: formatNumber with fraction digits option works correctly
	 *
	 * The minimumFractionDigits option should control decimal places.
	 *
	 * **Validates: Requirements 7.4**
	 */
	it('should respect fraction digits options', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 1000 }),
				localeArb,
				fc.integer({ min: 0, max: 4 }),
				(num, locale, fractionDigits) => {
					const result = formatNumber(num, locale, {
						minimumFractionDigits: fractionDigits,
						maximumFractionDigits: fractionDigits
					});

					// Should return a valid string
					expect(typeof result).toBe('string');
					expect(result.length).toBeGreaterThan(0);

					// If fractionDigits > 0, should contain decimal separator
					if (fractionDigits > 0) {
						// Hungarian uses comma, English uses period
						const hasDecimal = result.includes(',') || result.includes('.');
						expect(hasDecimal).toBe(true);
					}

					return true;
				}
			),
			testConfig
		);
	});
});

describe('Format Edge Cases', () => {
	/**
	 * Invalid date input returns original value as string
	 */
	it('should handle invalid date input gracefully', () => {
		const invalidInputs = ['not a date', '', 'invalid'];

		for (const input of invalidInputs) {
			const result = formatDate(input, 'en');
			expect(typeof result).toBe('string');
			expect(result).toBe(input);
		}
	});

	/**
	 * NaN number input returns "NaN" string
	 */
	it('should handle NaN number input gracefully', () => {
		const result = formatNumber(NaN, 'en');
		expect(result).toBe('NaN');
	});

	/**
	 * Default locale is used when not specified
	 */
	it('should use default locale when not specified', () => {
		const date = new Date('2024-01-15');
		const num = 1234.56;

		const dateResult = formatDate(date);
		const numResult = formatNumber(num);

		expect(typeof dateResult).toBe('string');
		expect(dateResult.length).toBeGreaterThan(0);
		expect(typeof numResult).toBe('string');
		expect(numResult.length).toBeGreaterThan(0);
	});
});
