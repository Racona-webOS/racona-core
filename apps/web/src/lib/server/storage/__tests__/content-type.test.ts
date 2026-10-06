// @vitest-environment node
/**
 * Content-Type és Content-Disposition a kiszolgált fájlokhoz (content-type.ts).
 *
 * - A tárolt (feltöltéskor detektált) MIME típus elsőbbséget élvez a kiterjesztéssel szemben.
 * - Aktív tartalom (HTML, JS, SVG, XML) soha nem a saját típusával megy ki.
 * - Csak a böngészőben biztonságosan megjeleníthető típusok mennek inline.
 *
 * **Validates: Requirements 6.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	getMimeTypeFromExtension,
	resolveFileResponseType,
	buildContentDisposition
} from '../content-type';

const ACTIVE_TYPES = [
	'text/html',
	'text/html; charset=utf-8',
	'TEXT/HTML',
	'application/xhtml+xml',
	'image/svg+xml',
	'application/javascript',
	'text/javascript',
	'application/xml',
	'text/xml'
];

const ACTIVE_EXTENSIONS = ['html', 'htm', 'js', 'mjs', 'svg', 'xml', 'xhtml', 'css', 'json'];

const filenameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

describe('getMimeTypeFromExtension', () => {
	it('maps common safe extensions', () => {
		expect(getMimeTypeFromExtension('backgrounds/shared/image/a.JPG')).toBe('image/jpeg');
		expect(getMimeTypeFromExtension('a.png')).toBe('image/png');
		expect(getMimeTypeFromExtension('docs/user-1/report.pdf')).toBe('application/pdf');
		expect(getMimeTypeFromExtension('backgrounds/shared/video/v.mp4')).toBe('video/mp4');
	});

	it('never maps active-content extensions', () => {
		for (const ext of ACTIVE_EXTENSIONS) {
			expect(getMimeTypeFromExtension(`x/shared/file.${ext}`)).toBe('application/octet-stream');
		}
	});

	it('returns octet-stream for missing or unknown extensions', () => {
		expect(getMimeTypeFromExtension('noext')).toBe('application/octet-stream');
		expect(getMimeTypeFromExtension('.hidden')).toBe('application/octet-stream');
		expect(getMimeTypeFromExtension('a.toString')).toBe('application/octet-stream');
		expect(getMimeTypeFromExtension('a.__proto__')).toBe('application/octet-stream');
	});
});

describe('resolveFileResponseType', () => {
	it('prefers the stored MIME type over the extension', () => {
		expect(resolveFileResponseType('image/png', 'images/user-1/photo.jpg')).toEqual({
			contentType: 'image/png',
			disposition: 'inline'
		});
		expect(resolveFileResponseType('application/pdf', 'documents/user-1/x.txt')).toEqual({
			contentType: 'application/pdf',
			disposition: 'inline'
		});
	});

	it('falls back to the extension without a stored type', () => {
		expect(resolveFileResponseType(null, 'backgrounds/shared/image/a.webp')).toEqual({
			contentType: 'image/webp',
			disposition: 'inline'
		});
		expect(resolveFileResponseType(undefined, 'x/shared/a.zip')).toEqual({
			contentType: 'application/zip',
			disposition: 'attachment'
		});
	});

	it('never serves active content with its own type, whatever is stored', () => {
		fc.assert(
			fc.property(fc.constantFrom(...ACTIVE_TYPES), filenameArb, (stored, name) => {
				const result = resolveFileResponseType(stored, `docs/user-1/${name}.png`);
				expect(result.contentType).toBe('application/octet-stream');
				expect(result.disposition).toBe('attachment');
			})
		);
	});

	it('never serves active content by extension', () => {
		fc.assert(
			fc.property(fc.constantFrom(...ACTIVE_EXTENSIONS), filenameArb, (ext, name) => {
				const result = resolveFileResponseType(null, `docs/shared/${name}.${ext}`);
				expect(result.contentType).toBe('application/octet-stream');
				expect(result.disposition).toBe('attachment');
			})
		);
	});

	it('serves office documents and unknown types as attachments', () => {
		expect(
			resolveFileResponseType(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'documents/user-1/a.docx'
			).disposition
		).toBe('attachment');
		expect(resolveFileResponseType('application/x-something', 'a/shared/b').disposition).toBe(
			'attachment'
		);
	});

	it('strips MIME parameters from the stored type', () => {
		expect(resolveFileResponseType('text/plain; charset=utf-8', 'a/shared/b.txt')).toEqual({
			contentType: 'text/plain',
			disposition: 'inline'
		});
	});
});

describe('buildContentDisposition', () => {
	it('quotes an ASCII fallback and adds the UTF-8 name', () => {
		expect(buildContentDisposition('inline', 'photo.png')).toBe(
			`inline; filename="photo.png"; filename*=UTF-8''photo.png`
		);
		const header = buildContentDisposition('attachment', 'árvíz "x".pdf');
		expect(header.startsWith('attachment; filename="')).toBe(true);
		expect(header).not.toMatch(/filename="[^"]*"[^;]*"/);
		expect(header).toContain(`filename*=UTF-8''${encodeURIComponent('árvíz "x".pdf')}`);
	});
});
