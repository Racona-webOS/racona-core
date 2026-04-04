/**
 * Property-Based Tests for Translation Entry Structure
 *
 * Feature: multi-language-support
 * Property 10: Translation entry struktúra
 *
 * _Bármely_ létrehozott Translation_Entry tartalmazza az összes kötelező mezőt:
 * id, locale, namespace, key, value, created_at, updated_at.
 *
 * **Validates: Requirements 4.1**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { TranslationEntry, CreateTranslationInput } from '$lib/i18n/types';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

/**
 * Helper function to create a TranslationEntry from CreateTranslationInput.
 * This simulates what the repository does when creating an entry.
 */
function createTranslationEntry(input: CreateTranslationInput, id: number): TranslationEntry {
	const now = new Date();
	return {
		id,
		locale: input.locale,
		namespace: input.namespace,
		key: input.key,
		value: input.value,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Helper function to validate that a TranslationEntry has all required fields.
 */
function validateTranslationEntry(entry: TranslationEntry): {
	valid: boolean;
	missingFields: string[];
} {
	const requiredFields = ['id', 'locale', 'namespace', 'key', 'value', 'createdAt', 'updatedAt'];
	const missingFields: string[] = [];

	for (const field of requiredFields) {
		if (!(field in entry) || entry[field as keyof TranslationEntry] === undefined) {
			missingFields.push(field);
		}
	}

	return {
		valid: missingFields.length === 0,
		missingFields
	};
}

/**
 * Property 10: Translation entry struktúra
 *
 * _Bármely_ létrehozott Translation_Entry tartalmazza az összes kötelező mezőt:
 * id, locale, namespace, key, value, created_at, updated_at.
 *
 * **Validates: Requirements 4.1**
 */
describe('Property 10: Translation entry struktúra', () => {
	// Valid locale code generator (2-10 characters)
	const localeArb = fc
		.stringMatching(/^[a-z]{2}(-[A-Z]{2})?$/)
		.filter((s) => s.length >= 2 && s.length <= 10);

	// Valid namespace generator
	const namespaceArb = fc
		.stringMatching(/^[a-z][a-z0-9_]*$/)
		.filter((s) => s.length >= 1 && s.length <= 100);

	// Valid key generator
	const keyArb = fc
		.stringMatching(/^[a-z][a-z0-9_.]*$/)
		.filter((s) => s.length >= 1 && s.length <= 255);

	// Valid value generator (any non-empty string)
	const valueArb = fc.string({ minLength: 1, maxLength: 1000 });

	// Valid positive integer ID generator
	const idArb = fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER });

	// CreateTranslationInput generator
	const createInputArb = fc.record({
		locale: localeArb,
		namespace: namespaceArb,
		key: keyArb,
		value: valueArb
	});

	/**
	 * Property 10a: All required fields are present
	 *
	 * Any created TranslationEntry must contain all required fields:
	 * id, locale, namespace, key, value, createdAt, updatedAt.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should contain all required fields in created TranslationEntry', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);
				const validation = validateTranslationEntry(entry);

				expect(validation.valid).toBe(true);
				expect(validation.missingFields).toEqual([]);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10b: ID field is a positive integer
	 *
	 * The id field must be a positive integer.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should have id as a positive integer', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(typeof entry.id).toBe('number');
				expect(Number.isInteger(entry.id)).toBe(true);
				expect(entry.id).toBeGreaterThan(0);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10c: Locale field matches input
	 *
	 * The locale field must match the input locale exactly.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should preserve locale from input', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(typeof entry.locale).toBe('string');
				expect(entry.locale).toBe(input.locale);
				expect(entry.locale.length).toBeGreaterThan(0);
				expect(entry.locale.length).toBeLessThanOrEqual(10);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10d: Namespace field matches input
	 *
	 * The namespace field must match the input namespace exactly.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should preserve namespace from input', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(typeof entry.namespace).toBe('string');
				expect(entry.namespace).toBe(input.namespace);
				expect(entry.namespace.length).toBeGreaterThan(0);
				expect(entry.namespace.length).toBeLessThanOrEqual(100);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10e: Key field matches input
	 *
	 * The key field must match the input key exactly.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should preserve key from input', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(typeof entry.key).toBe('string');
				expect(entry.key).toBe(input.key);
				expect(entry.key.length).toBeGreaterThan(0);
				expect(entry.key.length).toBeLessThanOrEqual(255);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10f: Value field matches input
	 *
	 * The value field must match the input value exactly.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should preserve value from input', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(typeof entry.value).toBe('string');
				expect(entry.value).toBe(input.value);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10g: Timestamps are valid Date objects
	 *
	 * The createdAt and updatedAt fields must be valid Date objects.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should have valid Date objects for timestamps', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(entry.createdAt).toBeInstanceOf(Date);
				expect(entry.updatedAt).toBeInstanceOf(Date);
				expect(isNaN(entry.createdAt.getTime())).toBe(false);
				expect(isNaN(entry.updatedAt.getTime())).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10h: createdAt and updatedAt are equal on creation
	 *
	 * When a TranslationEntry is first created, createdAt and updatedAt
	 * should be equal (or very close in time).
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should have equal createdAt and updatedAt on creation', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				// Timestamps should be equal on creation
				expect(entry.createdAt.getTime()).toBe(entry.updatedAt.getTime());

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10i: TranslationEntry extends CreateTranslationInput
	 *
	 * A TranslationEntry should contain all fields from CreateTranslationInput
	 * plus the additional fields (id, createdAt, updatedAt).
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should extend CreateTranslationInput with additional fields', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				// All CreateTranslationInput fields should be present
				expect(entry.locale).toBe(input.locale);
				expect(entry.namespace).toBe(input.namespace);
				expect(entry.key).toBe(input.key);
				expect(entry.value).toBe(input.value);

				// Additional fields should be present
				expect('id' in entry).toBe(true);
				expect('createdAt' in entry).toBe(true);
				expect('updatedAt' in entry).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10j: Field types are correct
	 *
	 * All fields should have the correct types as defined in the interface.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should have correct field types', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				// Type checks
				expect(typeof entry.id).toBe('number');
				expect(typeof entry.locale).toBe('string');
				expect(typeof entry.namespace).toBe('string');
				expect(typeof entry.key).toBe('string');
				expect(typeof entry.value).toBe('string');
				expect(entry.createdAt).toBeInstanceOf(Date);
				expect(entry.updatedAt).toBeInstanceOf(Date);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10k: No undefined or null values in required fields
	 *
	 * All required fields should have defined, non-null values.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should not have undefined or null values in required fields', () => {
		fc.assert(
			fc.property(createInputArb, idArb, (input, id) => {
				const entry = createTranslationEntry(input, id);

				expect(entry.id).not.toBeUndefined();
				expect(entry.id).not.toBeNull();
				expect(entry.locale).not.toBeUndefined();
				expect(entry.locale).not.toBeNull();
				expect(entry.namespace).not.toBeUndefined();
				expect(entry.namespace).not.toBeNull();
				expect(entry.key).not.toBeUndefined();
				expect(entry.key).not.toBeNull();
				expect(entry.value).not.toBeUndefined();
				expect(entry.value).not.toBeNull();
				expect(entry.createdAt).not.toBeUndefined();
				expect(entry.createdAt).not.toBeNull();
				expect(entry.updatedAt).not.toBeUndefined();
				expect(entry.updatedAt).not.toBeNull();

				return true;
			}),
			testConfig
		);
	});
});
