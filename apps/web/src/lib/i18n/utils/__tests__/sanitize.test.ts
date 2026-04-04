/**
 * Property-Based Tests for HTML Sanitization Utility
 *
 * Feature: multi-language-support
 * Property 17: HTML sanitization
 *
 * _Bármely_ HTML tartalmat tartalmazó fordítás esetén a veszélyes elemek
 * (script, onclick, stb.) kiszűrődnek a megjelenítés előtt.
 *
 * **Validates: Requirements 7.6**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	sanitizeHtml,
	stripHtmlTags,
	isSafeHtml,
	containsDangerousElement,
	containsDangerousAttribute,
	containsDangerousProtocol,
	DANGEROUS_ELEMENTS,
	DANGEROUS_ATTRIBUTES,
	DANGEROUS_PROTOCOLS
} from '../sanitize.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// Arbitrary for safe text content (no HTML special chars)
const safeTextArb = fc
	.string({ minLength: 0, maxLength: 100 })
	.map((s) => s.replace(/[<>&"']/g, ''));

// Arbitrary for dangerous element names
const dangerousElementArb = fc.constantFrom(...DANGEROUS_ELEMENTS);

// Arbitrary for dangerous attribute names
const dangerousAttributeArb = fc.constantFrom(...DANGEROUS_ATTRIBUTES);

// Arbitrary for dangerous protocols
const dangerousProtocolArb = fc.constantFrom(...DANGEROUS_PROTOCOLS);

// Arbitrary for safe HTML elements
const safeElementArb = fc.constantFrom(
	'div',
	'span',
	'p',
	'a',
	'strong',
	'em',
	'b',
	'i',
	'u',
	'br',
	'ul',
	'ol',
	'li',
	'h1',
	'h2',
	'h3'
);

// Arbitrary for attribute values (safe content)
const attrValueArb = fc
	.string({ minLength: 1, maxLength: 50 })
	.map((s) => s.replace(/[<>&"']/g, ''));

describe('HTML Sanitization - Property 17: HTML sanitization', () => {
	/**
	 * Property 17a: Dangerous elements are removed
	 *
	 * When HTML contains dangerous elements (script, iframe, etc.),
	 * they should be completely removed from the output.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should remove all dangerous elements from HTML', () => {
		fc.assert(
			fc.property(
				dangerousElementArb,
				safeTextArb,
				safeTextArb,
				safeTextArb,
				(element, content, prefix, suffix) => {
					// Create HTML with dangerous element
					const html = `${prefix}<${element}>${content}</${element}>${suffix}`;

					const result = sanitizeHtml(html);

					// The dangerous element should be removed
					expect(result.toLowerCase()).not.toContain(`<${element}`);
					expect(result.toLowerCase()).not.toContain(`</${element}>`);

					// The result should be safe
					expect(isSafeHtml(result)).toBe(true);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 17b: Self-closing dangerous elements are removed
	 *
	 * Self-closing dangerous elements should also be removed.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should remove self-closing dangerous elements', () => {
		fc.assert(
			fc.property(dangerousElementArb, safeTextArb, safeTextArb, (element, prefix, suffix) => {
				// Create HTML with self-closing dangerous element
				const html = `${prefix}<${element} />${suffix}`;

				const result = sanitizeHtml(html);

				// The dangerous element should be removed
				expect(result.toLowerCase()).not.toContain(`<${element}`);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 17c: Dangerous attributes are removed
	 *
	 * When HTML contains dangerous attributes (onclick, onerror, etc.),
	 * they should be removed while preserving the element.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should remove dangerous attributes from elements', () => {
		fc.assert(
			fc.property(
				safeElementArb,
				dangerousAttributeArb,
				attrValueArb,
				safeTextArb,
				(element, attr, value, content) => {
					// Create HTML with dangerous attribute
					const html = `<${element} ${attr}="${value}">${content}</${element}>`;

					const result = sanitizeHtml(html);

					// The dangerous attribute should be removed
					expect(result.toLowerCase()).not.toContain(`${attr}=`);

					// The element itself should be preserved (if it's safe)
					if (!DANGEROUS_ELEMENTS.includes(element as (typeof DANGEROUS_ELEMENTS)[number])) {
						expect(result.toLowerCase()).toContain(`<${element}`);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 17d: Dangerous protocols in href/src are neutralized
	 *
	 * When href or src attributes contain dangerous protocols (javascript:, data:),
	 * they should be neutralized.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should neutralize dangerous protocols in href and src', () => {
		fc.assert(
			fc.property(dangerousProtocolArb, safeTextArb, safeTextArb, (protocol, payload, content) => {
				// Create HTML with dangerous protocol in href
				const htmlHref = `<a href="${protocol}${payload}">${content}</a>`;
				const resultHref = sanitizeHtml(htmlHref);

				// The dangerous protocol should be removed or neutralized
				expect(resultHref.toLowerCase()).not.toContain(protocol);

				// Create HTML with dangerous protocol in src
				const htmlSrc = `<img src="${protocol}${payload}">`;
				const resultSrc = sanitizeHtml(htmlSrc);

				// The dangerous protocol should be removed or neutralized
				expect(resultSrc.toLowerCase()).not.toContain(protocol);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 17e: Safe HTML is preserved
	 *
	 * When HTML contains only safe elements and attributes,
	 * they should be preserved in the output.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should preserve safe HTML elements and content', () => {
		fc.assert(
			fc.property(safeElementArb, safeTextArb, (element, content) => {
				// Create safe HTML
				const html = `<${element}>${content}</${element}>`;

				const result = sanitizeHtml(html);

				// The safe element should be preserved
				expect(result).toContain(`<${element}>`);
				expect(result).toContain(content);
				expect(result).toContain(`</${element}>`);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 17f: Sanitized output is always safe
	 *
	 * For any input, the sanitized output should never contain
	 * dangerous elements, attributes, or protocols.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should always produce safe output', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 0, maxLength: 500 }), (input) => {
				const result = sanitizeHtml(input);

				// The result should be safe
				expect(isSafeHtml(result)).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 17g: Multiple dangerous elements are all removed
	 *
	 * When HTML contains multiple different dangerous elements,
	 * all of them should be removed.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should remove all dangerous elements when multiple are present', () => {
		fc.assert(
			fc.property(
				fc.uniqueArray(dangerousElementArb, { minLength: 2, maxLength: 4 }),
				safeTextArb,
				(elements, content) => {
					// Create HTML with multiple dangerous elements
					const html = elements.map((el) => `<${el}>${content}</${el}>`).join('');

					const result = sanitizeHtml(html);

					// All dangerous elements should be removed
					for (const element of elements) {
						expect(result.toLowerCase()).not.toContain(`<${element}`);
						expect(result.toLowerCase()).not.toContain(`</${element}>`);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 17h: Nested dangerous elements are removed
	 *
	 * When dangerous elements are nested inside safe elements,
	 * the dangerous elements should still be removed.
	 *
	 * **Validates: Requirements 7.6**
	 */
	it('should remove nested dangerous elements', () => {
		fc.assert(
			fc.property(
				safeElementArb,
				dangerousElementArb,
				safeTextArb,
				(safeEl, dangerousEl, content) => {
					// Create HTML with nested dangerous element
					const html = `<${safeEl}><${dangerousEl}>${content}</${dangerousEl}></${safeEl}>`;

					const result = sanitizeHtml(html);

					// The dangerous element should be removed
					expect(result.toLowerCase()).not.toContain(`<${dangerousEl}`);

					// The safe element should be preserved
					expect(result.toLowerCase()).toContain(`<${safeEl}>`);

					return true;
				}
			),
			testConfig
		);
	});
});

describe('HTML Sanitization Helper Functions', () => {
	/**
	 * containsDangerousElement correctly detects dangerous elements
	 */
	it('should correctly detect dangerous elements', () => {
		fc.assert(
			fc.property(dangerousElementArb, safeTextArb, (element, content) => {
				const html = `<${element}>${content}</${element}>`;
				expect(containsDangerousElement(html)).toBe(true);

				const safeHtml = `<div>${content}</div>`;
				expect(containsDangerousElement(safeHtml)).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * containsDangerousAttribute correctly detects dangerous attributes
	 */
	it('should correctly detect dangerous attributes', () => {
		fc.assert(
			fc.property(dangerousAttributeArb, attrValueArb, (attr, value) => {
				const html = `<div ${attr}="${value}">content</div>`;
				expect(containsDangerousAttribute(html)).toBe(true);

				const safeHtml = `<div class="safe">content</div>`;
				expect(containsDangerousAttribute(safeHtml)).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * containsDangerousProtocol correctly detects dangerous protocols
	 */
	it('should correctly detect dangerous protocols', () => {
		fc.assert(
			fc.property(dangerousProtocolArb, safeTextArb, (protocol, payload) => {
				const html = `<a href="${protocol}${payload}">link</a>`;
				expect(containsDangerousProtocol(html)).toBe(true);

				const safeHtml = `<a href="https://example.com">link</a>`;
				expect(containsDangerousProtocol(safeHtml)).toBe(false);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * stripHtmlTags removes all HTML tags
	 */
	it('should strip all HTML tags', () => {
		fc.assert(
			fc.property(safeElementArb, safeTextArb, (element, content) => {
				const html = `<${element}>${content}</${element}>`;
				const result = stripHtmlTags(html);

				// Should not contain any HTML tags
				expect(result).not.toContain('<');
				expect(result).not.toContain('>');

				// Should contain the text content
				expect(result).toBe(content);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * isSafeHtml correctly identifies safe content
	 */
	it('should correctly identify safe HTML', () => {
		fc.assert(
			fc.property(safeElementArb, safeTextArb, (element, content) => {
				const safeHtml = `<${element}>${content}</${element}>`;
				expect(isSafeHtml(safeHtml)).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * isSafeHtml correctly identifies unsafe content
	 */
	it('should correctly identify unsafe HTML', () => {
		fc.assert(
			fc.property(dangerousElementArb, safeTextArb, (element, content) => {
				const unsafeHtml = `<${element}>${content}</${element}>`;
				expect(isSafeHtml(unsafeHtml)).toBe(false);

				return true;
			}),
			testConfig
		);
	});
});
