// @vitest-environment node
/**
 * Feltöltési méretkorlát: a kliens és a szerver ugyanabból a BODY_SIZE_LIMIT-ből számol,
 * és a megengedett legnagyobb fájl base64-ben is belefér a kérésbe.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
	DEFAULT_BODY_SIZE_LIMIT,
	DEFAULT_MAX_UPLOAD_BYTES,
	UPLOAD_REQUEST_OVERHEAD_BYTES,
	maxUploadBytesForBodyLimit,
	formatBytes
} from '../limits';
import { DEFAULT_CONFIG } from '$lib/components/file-uploader/types';
import { getMaxUploadBytes, estimateDecodedSize } from '$lib/server/storage/limits';

const MIB = 1024 * 1024;

/** A kérés mérete egy adott fájlhoz: data URL base64 + a többi mező (felülről becsülve). */
function requestSizeFor(fileBytes: number): number {
	return Math.ceil(fileBytes / 3) * 4 + UPLOAD_REQUEST_OVERHEAD_BYTES;
}

describe('maxUploadBytesForBodyLimit', () => {
	it('is 7 MiB for the default 10 MiB body limit', () => {
		expect(DEFAULT_BODY_SIZE_LIMIT).toBe(10 * MIB);
		expect(DEFAULT_MAX_UPLOAD_BYTES).toBe(7 * MIB);
	});

	it('the FileUploader default equals the server default', () => {
		expect(DEFAULT_CONFIG.maxFileSize).toBe(DEFAULT_MAX_UPLOAD_BYTES);
	});

	it('the largest allowed file always fits into the body limit as base64', () => {
		fc.assert(
			fc.property(fc.integer({ min: UPLOAD_REQUEST_OVERHEAD_BYTES + 1, max: 1024 * MIB }), (limit) => {
				const max = maxUploadBytesForBodyLimit(limit);
				expect(max).toBeGreaterThanOrEqual(0);
				expect(requestSizeFor(max)).toBeLessThanOrEqual(limit);
			})
		);
	});

	it('returns 0 for unusable limits', () => {
		expect(maxUploadBytesForBodyLimit(0)).toBe(0);
		expect(maxUploadBytesForBodyLimit(UPLOAD_REQUEST_OVERHEAD_BYTES)).toBe(0);
		expect(maxUploadBytesForBodyLimit(Number.NaN)).toBe(0);
	});
});

describe('formatBytes', () => {
	it('formats sizes', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(7 * MIB)).toBe('7 MB');
		expect(formatBytes(1536)).toBe('1.5 KB');
	});
});

describe('getMaxUploadBytes (server)', () => {
	const original = process.env.BODY_SIZE_LIMIT;

	afterEach(() => {
		if (original === undefined) delete process.env.BODY_SIZE_LIMIT;
		else process.env.BODY_SIZE_LIMIT = original;
	});

	it('follows BODY_SIZE_LIMIT', () => {
		process.env.BODY_SIZE_LIMIT = String(20 * MIB);
		expect(getMaxUploadBytes()).toBe(maxUploadBytesForBodyLimit(20 * MIB));
	});

	it('uses the default when BODY_SIZE_LIMIT is missing or invalid', () => {
		delete process.env.BODY_SIZE_LIMIT;
		expect(getMaxUploadBytes()).toBe(DEFAULT_MAX_UPLOAD_BYTES);
		process.env.BODY_SIZE_LIMIT = 'abc';
		expect(getMaxUploadBytes()).toBe(DEFAULT_MAX_UPLOAD_BYTES);
	});
});

describe('estimateDecodedSize', () => {
	it('matches the decoded buffer length, with or without data URL prefix', () => {
		fc.assert(
			fc.property(fc.uint8Array({ maxLength: 2000 }), (bytes) => {
				const base64 = Buffer.from(bytes).toString('base64');
				expect(estimateDecodedSize(base64)).toBe(bytes.length);
				expect(estimateDecodedSize(`data:image/png;base64,${base64}`)).toBe(bytes.length);
			})
		);
	});
});
