// @vitest-environment node
/**
 * Méretkorlát, feltöltési hibaüzenetek és engedélyezett képformátumok.
 */

import { describe, it, expect } from 'vitest';
import { error } from '@sveltejs/kit';
import {
	validateFiles,
	describeUploadError,
	fileTooLargeMessage,
	REQUEST_TOO_LARGE_MESSAGE
} from '../validation.js';
import { DEFAULT_CONFIG, FILE_TYPE_EXTENSIONS, MIME_TYPE_MAP } from '../types.js';
import { validateMimeType } from '../mime-validator.js';

const MIB = 1024 * 1024;

/** Valódi SvelteKit HttpError (ilyet dob a remote function hívás a kliensen). */
function httpError(status: number, message: string): unknown {
	try {
		error(status, message);
	} catch (e) {
		return e;
	}
}

function fakeFile(name: string, size: number): File {
	return { name, size, type: '' } as File;
}

describe('client size check', () => {
	it('defaults to 7 MB so the base64 request fits into the 10 MB body limit', () => {
		expect(DEFAULT_CONFIG.maxFileSize).toBe(7 * MIB);
	});

	it('rejects a file between 7 and 10 MB with the limit in the message', () => {
		const result = validateFiles([fakeFile('big.jpg', 9 * MIB)]);
		expect(result.valid).toBe(false);
		expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
		expect(result.errors[0].message).toBe(fileTooLargeMessage(7 * MIB));
		expect(result.errors[0].message).toContain('7 MB');
	});

	it('accepts a file at the limit', () => {
		expect(validateFiles([fakeFile('ok.jpg', 7 * MIB)]).valid).toBe(true);
	});
});

describe('describeUploadError', () => {
	it('recognizes the 413 HTTP error of a remote function call', () => {
		expect(describeUploadError(httpError(413, 'Payload Too Large'))).toBe(
			REQUEST_TOO_LARGE_MESSAGE
		);
	});

	it('recognizes the body limit messages', () => {
		expect(
			describeUploadError(new Error('Content-length of 12000000 exceeds limit of 10485760 bytes.'))
		).toBe(REQUEST_TOO_LARGE_MESSAGE);
	});

	it('blames the size for a generic failure of a large file only', () => {
		const generic = new Error('Failed to execute remote function');
		expect(describeUploadError(generic, 9 * MIB)).toBe(REQUEST_TOO_LARGE_MESSAGE);
		expect(describeUploadError(generic, 1 * MIB)).toBe('Failed to execute remote function');
	});

	it('uses the HTTP error message or the fallback otherwise', () => {
		expect(describeUploadError(httpError(500, 'Boom'))).toBe('Boom');
		expect(describeUploadError(new Error('Nope'))).toBe('Nope');
		expect(describeUploadError('x')).toBe('Feltöltés sikertelen');
		expect(describeUploadError(undefined, undefined, 'Upload failed')).toBe('Upload failed');
	});
});

describe('allowed image formats', () => {
	it('does not offer SVG or BMP', () => {
		expect(FILE_TYPE_EXTENSIONS.image).not.toContain('svg');
		expect(FILE_TYPE_EXTENSIONS.image).not.toContain('bmp');
		expect(MIME_TYPE_MAP.image).not.toContain('image/svg+xml');
		expect(MIME_TYPE_MAP.image).not.toContain('image/bmp');
	});

	it('rejects SVG and BMP content on the server', async () => {
		const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
		expect((await validateMimeType(svg, 'image', 'image/svg+xml')).valid).toBe(false);

		const bmp = Buffer.alloc(70);
		bmp.write('BM');
		bmp.writeUInt32LE(70, 2);
		bmp.writeUInt32LE(54, 10);
		bmp.writeUInt32LE(40, 14);
		bmp.writeInt32LE(2, 18);
		bmp.writeInt32LE(2, 22);
		bmp.writeUInt16LE(1, 26);
		bmp.writeUInt16LE(24, 28);
		const result = await validateMimeType(bmp, 'image', 'image/bmp');
		expect(result.valid).toBe(false);
		expect(result.detectedMimeType).toBe('image/bmp');
	});
});
