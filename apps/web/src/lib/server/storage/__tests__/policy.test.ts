// @vitest-environment node
/**
 * A core fájltárolás jogosultsági szabályai (policy.ts).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	SHARED_FILES_PERMISSION,
	canWriteScope,
	canDeleteFile,
	canReadFileMetadata
} from '../policy';

const userIdArb = fc.integer({ min: 1, max: 1_000_000 });
const otherPermissionsArb = fc.array(
	// A settings.update önmagában már nem elég (korábban ez engedte a shared fájlokat)
	fc.constantFrom('content.view', 'content.create', 'settings.view', 'settings.update'),
	{ maxLength: 4 }
);

describe('canWriteScope', () => {
	it('allows user scope for everyone', () => {
		expect(canWriteScope('user', []).allowed).toBe(true);
	});

	it('requires the shared files permission for shared scope', () => {
		fc.assert(
			fc.property(otherPermissionsArb, (permissions) => {
				const result = canWriteScope('shared', permissions);
				expect(result.allowed).toBe(false);
				if (!result.allowed) expect(result.error).toContain(SHARED_FILES_PERMISSION);
			})
		);
		expect(canWriteScope('shared', [SHARED_FILES_PERMISSION]).allowed).toBe(true);
	});
});

describe('canDeleteFile', () => {
	it('lets the owner delete their user-scope file', () => {
		fc.assert(
			fc.property(userIdArb, (userId) => {
				expect(canDeleteFile({ scope: 'user', userId }, userId, []).allowed).toBe(true);
			})
		);
	});

	it("denies deleting another user's file, even with the shared permission", () => {
		fc.assert(
			fc.property(userIdArb, userIdArb, (ownerId, requesterId) => {
				fc.pre(ownerId !== requesterId);
				const result = canDeleteFile({ scope: 'user', userId: ownerId }, requesterId, [
					SHARED_FILES_PERMISSION
				]);
				expect(result.allowed).toBe(false);
			})
		);
	});

	it('denies deleting a user-scope file without owner (deleted user)', () => {
		fc.assert(
			fc.property(userIdArb, (requesterId) => {
				expect(canDeleteFile({ scope: 'user', userId: null }, requesterId, []).allowed).toBe(false);
			})
		);
	});

	it('lets users with the permission delete shared files (saved with userId null)', () => {
		fc.assert(
			fc.property(userIdArb, fc.option(userIdArb, { nil: null }), (requesterId, uploaderId) => {
				const file = { scope: 'shared', userId: uploaderId };
				expect(canDeleteFile(file, requesterId, [SHARED_FILES_PERMISSION]).allowed).toBe(true);
			})
		);
	});

	it('denies deleting shared files without the permission', () => {
		fc.assert(
			fc.property(userIdArb, otherPermissionsArb, (requesterId, permissions) => {
				const result = canDeleteFile({ scope: 'shared', userId: null }, requesterId, permissions);
				expect(result.allowed).toBe(false);
				if (!result.allowed) expect(result.error).toContain('Permission denied');
			})
		);
	});
});

describe('canReadFileMetadata', () => {
	it('allows shared files and own files only', () => {
		expect(canReadFileMetadata({ scope: 'shared', userId: null }, 1)).toBe(true);
		expect(canReadFileMetadata({ scope: 'user', userId: 1 }, 1)).toBe(true);
		expect(canReadFileMetadata({ scope: 'user', userId: 2 }, 1)).toBe(false);
		expect(canReadFileMetadata({ scope: 'user', userId: null }, 1)).toBe(false);
	});
});
