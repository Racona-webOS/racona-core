// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { contentDisposition, decodeFileNameHeader } from '../access';

describe('contentDisposition', () => {
	it('adds an ASCII fallback and the UTF-8 name', () => {
		expect(contentDisposition('inline', 'Munkaszerződés (2026).pdf')).toBe(
			`inline; filename="Munkaszerzodes (2026).pdf"; filename*=UTF-8''Munkaszerz%C5%91d%C3%A9s%20%282026%29.pdf`
		);
	});

	it('never lets quotes break the header', () => {
		expect(contentDisposition('attachment', 'a"b\\c.pdf')).toMatch(/^attachment; filename="abc\.pdf";/);
	});
});

describe('decodeFileNameHeader', () => {
	it('decodes URI-encoded names and tolerates bad input', () => {
		expect(decodeFileNameHeader(encodeURIComponent('Bizonyítvány.pdf'))).toBe('Bizonyítvány.pdf');
		expect(decodeFileNameHeader('%E0%A4%A')).toBe('%E0%A4%A');
		expect(decodeFileNameHeader(null)).toBe('');
	});
});
