// @vitest-environment node
/**
 * Fel- és letöltési tokenek (.kiro/specs/plugin-file-storage, 5.1, 6.1).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { signToken, verifyToken, type UploadTokenPayload } from '../tokens';

beforeAll(() => {
	process.env.BETTER_AUTH_SECRET = 'test-secret-for-plugin-files';
});

const future = () => Math.floor(Date.now() / 1000) + 60;

function uploadPayload(overrides: Partial<UploadTokenPayload> = {}): UploadTokenPayload {
	return { k: 'u', p: 'demo-plugin', u: 7, m: ['application/pdf'], s: 1024, e: future(), ...overrides };
}

describe('plugin file tokens', () => {
	it('round-trips a valid upload token', () => {
		const payload = uploadPayload({ r: 'doc:1' });
		expect(verifyToken(signToken(payload), 'u')).toEqual(payload);
	});

	it('rejects a token of the other kind', () => {
		expect(verifyToken(signToken(uploadPayload()), 'd')).toBeNull();
	});

	it('rejects an expired token', () => {
		const token = signToken(uploadPayload({ e: Math.floor(Date.now() / 1000) - 1 }));
		expect(verifyToken(token, 'u')).toBeNull();
	});

	it('rejects a tampered payload', () => {
		const token = signToken(uploadPayload());
		const [, sig] = token.split('.');
		const forged = Buffer.from(JSON.stringify(uploadPayload({ s: 10 ** 9 }))).toString('base64url');
		expect(verifyToken(`${forged}.${sig}`, 'u')).toBeNull();
	});

	it('rejects a token signed with another secret', () => {
		const token = signToken(uploadPayload());
		process.env.BETTER_AUTH_SECRET = 'another-secret';
		try {
			expect(verifyToken(token, 'u')).toBeNull();
		} finally {
			process.env.BETTER_AUTH_SECRET = 'test-secret-for-plugin-files';
		}
	});

	it('rejects malformed tokens', () => {
		for (const token of ['', 'abc', 'a.b.c', '.sig', 'x'.repeat(5000)]) {
			expect(verifyToken(token, 'u')).toBeNull();
		}
	});
});
