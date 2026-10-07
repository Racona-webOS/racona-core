// @vitest-environment node
/**
 * Avatar törlése: jogosultság, a beépített avatar védelme, sorrend (adatbázis, majd fájlok).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mocks } = vi.hoisted(() => ({
	mocks: {
		permissions: [] as string[],
		findAvatarByIdname: vi.fn(),
		deleteAvatar: vi.fn(),
		rm: vi.fn()
	}
}));

vi.mock('$app/server', () => {
	// A séma-validálást itt nem teszteljük: a parancs a nyers függvény, a SvelteKit
	// remote-modul ellenőrzéséhez a __.type jelöléssel
	const remote = (type: string, fn: object) => Object.assign(fn, { __: { type } });
	return {
		command: (_schema: unknown, fn: object) => remote('command', fn),
		query: (fn: object) => remote('query', fn),
		getRequestEvent: () => ({ locals: { user: { id: '7' } } })
	};
});

vi.mock('$lib/server/database/repositories', () => ({
	DEFAULT_AVATAR_IDNAME: 'default',
	permissionRepository: {
		findPermissionsForUser: vi.fn(async () => mocks.permissions)
	},
	avatarRepository: {
		findAvatarByIdname: mocks.findAvatarByIdname,
		deleteAvatar: mocks.deleteAvatar
	}
}));

vi.mock('fs/promises', () => ({
	default: { rm: mocks.rm, mkdir: vi.fn(), writeFile: vi.fn() }
}));

const { deleteAvatar } = (await import('../avatar.remote')) as unknown as {
	deleteAvatar: (input: { idname: string }) => Promise<{
		success: boolean;
		error?: string;
		reassignedUsers?: number;
	}>;
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.permissions = ['settings.admin.aiAssistant'];
	mocks.findAvatarByIdname.mockResolvedValue({ idname: 'fox', displayName: 'Fox' });
	mocks.deleteAvatar.mockResolvedValue(2);
});

describe('deleteAvatar', () => {
	it('törli az adatbázis rekordot, utána az avatar mappáját', async () => {
		const result = await deleteAvatar({ idname: 'fox' });

		expect(result).toEqual({ success: true, reassignedUsers: 2 });
		expect(mocks.deleteAvatar).toHaveBeenCalledWith('fox');
		expect(mocks.rm).toHaveBeenCalledWith(expect.stringMatching(/uploads[\\/]ai-avatar[\\/]fox$/), {
			recursive: true,
			force: true
		});
		expect(mocks.deleteAvatar.mock.invocationCallOrder[0]).toBeLessThan(
			mocks.rm.mock.invocationCallOrder[0]
		);
	});

	it('admin jog nélkül nem töröl', async () => {
		mocks.permissions = [];

		const result = await deleteAvatar({ idname: 'fox' });

		expect(result.success).toBe(false);
		expect(mocks.deleteAvatar).not.toHaveBeenCalled();
		expect(mocks.rm).not.toHaveBeenCalled();
	});

	it('a beépített default avatar nem törölhető', async () => {
		const result = await deleteAvatar({ idname: 'default' });

		expect(result.success).toBe(false);
		expect(mocks.deleteAvatar).not.toHaveBeenCalled();
	});

	it('nem létező avatarnál hibát ad', async () => {
		mocks.findAvatarByIdname.mockResolvedValue(null);

		const result = await deleteAvatar({ idname: 'ghost' });

		expect(result.success).toBe(false);
		expect(mocks.rm).not.toHaveBeenCalled();
	});

	it('ha az adatbázis törlés hibázik, a fájlok megmaradnak', async () => {
		mocks.deleteAvatar.mockRejectedValue(new Error('db down'));

		const result = await deleteAvatar({ idname: 'fox' });

		expect(result).toEqual({ success: false, error: 'db down' });
		expect(mocks.rm).not.toHaveBeenCalled();
	});
});
