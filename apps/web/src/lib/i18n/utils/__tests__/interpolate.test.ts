/**
 * Property-Based Tests for Interpolation Utility
 *
 * Feature: multi-language-support
 * Property 14: Interpoláció
 *
 * _Bármely_ fordítás és paraméter kombináció esetén:
 * - A {name} szintaxisú változók helyettesítődnek a megfelelő paraméter értékével
 * - Ha egy változó hiányzik a paraméterekből, üres string helyettesítődik
 *
 * **Validates: Requirements 7.1, 7.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	interpolate,
	hasInterpolation,
	extractVariables,
	getMissingParams
} from '../interpolate.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// Arbitrary for valid variable names (alphanumeric, starting with letter)
const variableNameArb = fc
	.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/)
	.filter((s) => s.length >= 1 && s.length <= 20);

// Arbitrary for parameter values (string or number)
const paramValueArb = fc.oneof(
	fc.string({ minLength: 0, maxLength: 50 }),
	fc.integer({ min: -1000000, max: 1000000 }),
	fc.double({ min: -1000, max: 1000, noNaN: true })
);

// Arbitrary for text without interpolation variables
const plainTextArb = fc.string({ minLength: 0, maxLength: 100 }).map((s) => s.replace(/[{}]/g, ''));

describe('Interpolation - Property 14: Interpoláció', () => {
	/**
	 * Property 14a: Variables are replaced with parameter values
	 *
	 * When a text contains {name} variables and matching parameters are provided,
	 * the variables should be replaced with the parameter values.
	 *
	 * **Validates: Requirements 7.1**
	 */
	it('should replace {name} variables with corresponding parameter values', () => {
		fc.assert(
			fc.property(
				// Generate variable name
				variableNameArb,
				// Generate parameter value
				paramValueArb,
				// Generate surrounding text
				plainTextArb,
				plainTextArb,
				(varName, paramValue, prefix, suffix) => {
					const text = `${prefix}{${varName}}${suffix}`;
					const params = { [varName]: paramValue };

					const result = interpolate(text, params);

					// The variable should be replaced with the string representation of the value
					const expected = `${prefix}${String(paramValue)}${suffix}`;
					expect(result).toBe(expected);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 14b: Multiple variables are all replaced
	 *
	 * When a text contains multiple different {name} variables,
	 * all of them should be replaced with their corresponding values.
	 *
	 * **Validates: Requirements 7.1**
	 */
	it('should replace all multiple variables with their values', () => {
		fc.assert(
			fc.property(
				// Generate unique variable names
				fc.uniqueArray(variableNameArb, { minLength: 1, maxLength: 5 }),
				// Generate values for each variable
				fc.array(paramValueArb, { minLength: 5, maxLength: 5 }),
				(varNames, values) => {
					// Build text with all variables
					const text = varNames.map((name) => `{${name}}`).join(' ');

					// Build params object
					const params: Record<string, string | number> = {};
					varNames.forEach((name, i) => {
						params[name] = values[i % values.length];
					});

					const result = interpolate(text, params);

					// Verify no {varName} patterns remain
					for (const name of varNames) {
						expect(result).not.toContain(`{${name}}`);
					}

					// Verify all values are present
					for (const name of varNames) {
						expect(result).toContain(String(params[name]));
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 14c: Same variable used multiple times is replaced everywhere
	 *
	 * When the same variable appears multiple times in the text,
	 * all occurrences should be replaced.
	 *
	 * **Validates: Requirements 7.1**
	 */
	it('should replace all occurrences of the same variable', () => {
		fc.assert(
			fc.property(
				variableNameArb,
				// Use non-empty string or number to avoid split edge case with empty string
				fc.oneof(
					fc.string({ minLength: 1, maxLength: 50 }),
					fc.integer({ min: -1000000, max: 1000000 })
				),
				fc.integer({ min: 2, max: 5 }),
				(varName, paramValue, repeatCount) => {
					// Create text with repeated variable
					const text = Array(repeatCount).fill(`{${varName}}`).join(' - ');
					const params = { [varName]: paramValue };

					const result = interpolate(text, params);

					// Verify no variable placeholders remain
					expect(result).not.toContain(`{${varName}}`);

					// Verify the result has the expected structure
					const valueStr = String(paramValue);
					const expectedResult = Array(repeatCount).fill(valueStr).join(' - ');
					expect(result).toBe(expectedResult);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 14d: Missing variables are replaced with empty string
	 *
	 * When a variable in the text has no corresponding parameter,
	 * it should be replaced with an empty string.
	 *
	 * **Validates: Requirements 7.5**
	 */
	it('should replace missing variables with empty string', () => {
		fc.assert(
			fc.property(variableNameArb, plainTextArb, plainTextArb, (varName, prefix, suffix) => {
				const text = `${prefix}{${varName}}${suffix}`;

				// Call with empty params
				const resultEmpty = interpolate(text, {});
				expect(resultEmpty).toBe(`${prefix}${suffix}`);

				// Call with undefined params
				const resultUndefined = interpolate(text, undefined);
				expect(resultUndefined).toBe(`${prefix}${suffix}`);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 14e: Partial params - provided vars replaced, missing vars empty
	 *
	 * When some variables have params and others don't,
	 * provided ones are replaced with values, missing ones with empty string.
	 *
	 * **Validates: Requirements 7.1, 7.5**
	 */
	it('should handle partial params correctly', () => {
		fc.assert(
			fc.property(
				// Generate two different variable names
				variableNameArb,
				variableNameArb.filter((s) => s !== 'provided'),
				paramValueArb,
				(providedVar, missingVar, value) => {
					// Ensure different names
					if (providedVar === missingVar) return true;

					const text = `Hello {${providedVar}}, you have {${missingVar}} messages`;
					const params = { [providedVar]: value };

					const result = interpolate(text, params);

					// Provided variable should be replaced
					expect(result).toContain(String(value));
					expect(result).not.toContain(`{${providedVar}}`);

					// Missing variable should be empty
					expect(result).not.toContain(`{${missingVar}}`);
					expect(result).toContain(' messages'); // The space before 'messages' should remain

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 14f: Text without variables remains unchanged
	 *
	 * When text contains no {name} patterns, it should be returned as-is.
	 *
	 * **Validates: Requirements 7.1**
	 */
	it('should return text unchanged when no variables present', () => {
		fc.assert(
			fc.property(plainTextArb, paramValueArb, (text, value) => {
				const params = { someKey: value };

				const result = interpolate(text, params);

				expect(result).toBe(text);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 14g: Number values are converted to string
	 *
	 * When parameter values are numbers, they should be converted to strings.
	 *
	 * **Validates: Requirements 7.1**
	 */
	it('should convert number values to strings', () => {
		fc.assert(
			fc.property(
				variableNameArb,
				fc.oneof(
					fc.integer({ min: -1000000, max: 1000000 }),
					fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true })
				),
				(varName, numValue) => {
					const text = `Count: {${varName}}`;
					const params = { [varName]: numValue };

					const result = interpolate(text, params);

					expect(result).toBe(`Count: ${String(numValue)}`);

					return true;
				}
			),
			testConfig
		);
	});
});

describe('Interpolation Helper Functions', () => {
	/**
	 * hasInterpolation correctly detects variables
	 */
	it('should correctly detect presence of interpolation variables', () => {
		fc.assert(
			fc.property(variableNameArb, plainTextArb, (varName, plainText) => {
				// Text with variable should return true
				const textWithVar = `${plainText}{${varName}}`;
				expect(hasInterpolation(textWithVar)).toBe(true);

				// Plain text should return false
				expect(hasInterpolation(plainText)).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * extractVariables returns all unique variable names
	 */
	it('should extract all unique variable names', () => {
		fc.assert(
			fc.property(fc.uniqueArray(variableNameArb, { minLength: 1, maxLength: 5 }), (varNames) => {
				const text = varNames.map((name) => `{${name}}`).join(' ');

				const extracted = extractVariables(text);

				// Should contain all variable names
				expect(extracted.length).toBe(varNames.length);
				for (const name of varNames) {
					expect(extracted).toContain(name);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * getMissingParams identifies missing parameters
	 */
	it('should identify missing parameters correctly', () => {
		fc.assert(
			fc.property(fc.uniqueArray(variableNameArb, { minLength: 2, maxLength: 5 }), (varNames) => {
				const text = varNames.map((name) => `{${name}}`).join(' ');

				// Provide only first half of params
				const providedCount = Math.floor(varNames.length / 2);
				const params: Record<string, string> = {};
				for (let i = 0; i < providedCount; i++) {
					params[varNames[i]] = 'value';
				}

				const missing = getMissingParams(text, params);

				// Should identify the missing ones
				expect(missing.length).toBe(varNames.length - providedCount);
				for (let i = providedCount; i < varNames.length; i++) {
					expect(missing).toContain(varNames[i]);
				}

				return true;
			}),
			testConfig
		);
	});
});
