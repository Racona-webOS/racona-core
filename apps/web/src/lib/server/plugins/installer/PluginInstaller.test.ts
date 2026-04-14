/**
 * Unit tesztek a PluginInstaller email template feldolgozásához.
 *
 * Validates: Requirements 12.6, 12.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mockok ---

// Mock fs/promises
const mockAccess = vi.fn();
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
vi.mock('fs/promises', () => ({
	default: {
		access: (...args: unknown[]) => mockAccess(...args),
		readdir: (...args: unknown[]) => mockReaddir(...args),
		readFile: (...args: unknown[]) => mockReadFile(...args)
	}
}));

// Mock filesystem utils
vi.mock('../utils/filesystem', () => ({
	getPluginDir: (pluginId: string) => `/fake/plugins/${pluginId}`,
	ensureDir: vi.fn(),
	removeDir: vi.fn(),
	safeWriteFile: vi.fn(),
	copyDir: vi.fn()
}));

// Mock db — chain-style: insert().values().onConflictDoUpdate()
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

vi.mock('$lib/server/database', () => ({
	default: {
		insert: (...args: unknown[]) => mockInsert(...args),
		delete: (...args: unknown[]) => mockDelete(...args)
	}
}));

// Mock emailTemplates schema object — vi.hoisted() szükséges, mert a vi.mock hoist-olódik
const fakeEmailTemplates = vi.hoisted(() => ({
	type: 'type_col',
	locale: 'locale_col'
}));

vi.mock('@racona/database', () => ({
	emailTemplates: fakeEmailTemplates,
	PluginErrorCode: {}
}));

// Mock drizzle-orm like()
vi.mock('drizzle-orm', () => ({
	eq: vi.fn((col, val) => ({ op: 'eq', col, val })),
	like: vi.fn((col, pattern) => ({ op: 'like', col, pattern })),
	sql: vi.fn()
}));

// Mock adm-zip
vi.mock('adm-zip', () => ({
	default: vi.fn()
}));

// Mock validation
vi.mock('../validation/ZipValidator', () => ({
	zipValidator: {}
}));

import { PluginInstaller } from './PluginInstaller';

describe('PluginInstaller — email template feldolgozás', () => {
	let installer: PluginInstaller;

	beforeEach(() => {
		vi.clearAllMocks();
		installer = new PluginInstaller();
	});

	// --- importEmailTemplates ---

	describe('importEmailTemplates', () => {
		it('helyes type mezővel regisztrálja a template-et ({appId}:{fileName})', async () => {
			// email-templates/ mappa elérhető
			mockAccess.mockResolvedValue(undefined);
			// Egy JSON fájl van benne
			mockReaddir.mockResolvedValue(['employee_welcome.json']);
			// A fájl tartalma
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					name: 'Üdvözlő email',
					locales: {
						hu: {
							subject: 'Üdvözöljük!',
							html: '<h1>Szia</h1>',
							text: 'Szia'
						}
					},
					requiredData: ['name'],
					optionalData: ['position']
				})
			);

			await installer.importEmailTemplates('ely-work');

			// Az insert hívás values-ában a type mező: 'ely-work:employee_welcome'
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'ely-work:employee_welcome',
					locale: 'hu',
					name: 'Üdvözlő email',
					subjectTemplate: 'Üdvözöljük!',
					htmlTemplate: '<h1>Szia</h1>',
					textTemplate: 'Szia',
					requiredData: ['name'],
					optionalData: ['position'],
					isActive: true
				})
			);
		});

		it('több locale-t külön sorként kezel', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue(['employee_welcome.json']);
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					name: 'Welcome',
					locales: {
						hu: {
							subject: 'Üdvözöljük!',
							html: '<h1>Szia</h1>',
							text: 'Szia'
						},
						en: {
							subject: 'Welcome!',
							html: '<h1>Hello</h1>',
							text: 'Hello'
						}
					},
					requiredData: ['name'],
					optionalData: []
				})
			);

			await installer.importEmailTemplates('ely-work');

			// Két insert hívás kell legyen (hu + en)
			expect(mockValues).toHaveBeenCalledTimes(2);

			// Első: hu locale
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'ely-work:employee_welcome',
					locale: 'hu',
					subjectTemplate: 'Üdvözöljük!'
				})
			);

			// Második: en locale
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'ely-work:employee_welcome',
					locale: 'en',
					subjectTemplate: 'Welcome!'
				})
			);
		});

		it('több JSON fájlt is feldolgoz', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue(['employee_welcome.json', 'leave_approved.json']);

			// Két különböző fájl tartalma
			mockReadFile
				.mockResolvedValueOnce(
					JSON.stringify({
						name: 'Welcome',
						locales: {
							hu: { subject: 'Üdv', html: '<p>Üdv</p>', text: 'Üdv' }
						},
						requiredData: [],
						optionalData: []
					})
				)
				.mockResolvedValueOnce(
					JSON.stringify({
						name: 'Leave Approved',
						locales: {
							hu: { subject: 'Jóváhagyva', html: '<p>OK</p>', text: 'OK' }
						},
						requiredData: [],
						optionalData: []
					})
				);

			await installer.importEmailTemplates('test-app');

			// Két template, mindegyik 1 locale → 2 insert
			expect(mockValues).toHaveBeenCalledTimes(2);
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'test-app:employee_welcome' })
			);
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'test-app:leave_approved' })
			);
		});

		it('nem JSON fájlokat kihagyja', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue(['readme.md', 'template.json', 'notes.txt']);
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					name: 'Test',
					locales: {
						hu: { subject: 'S', html: '<p>H</p>', text: 'T' }
					},
					requiredData: [],
					optionalData: []
				})
			);

			await installer.importEmailTemplates('my-app');

			// Csak a .json fájl kerül feldolgozásra
			expect(mockReadFile).toHaveBeenCalledTimes(1);
			expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({ type: 'my-app:template' }));
		});

		it('ha nincs email-templates/ mappa, nem dob hibát', async () => {
			// fs.access dob hibát → mappa nem létezik
			mockAccess.mockRejectedValue(new Error('ENOENT'));

			await expect(installer.importEmailTemplates('ely-work')).resolves.toBeUndefined();
			expect(mockInsert).not.toHaveBeenCalled();
		});

		it('ha a mappa üres, nem történik insert', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue([]);

			await installer.importEmailTemplates('ely-work');

			expect(mockInsert).not.toHaveBeenCalled();
		});

		it('locales nélküli template-et kihagyja', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue(['bad_template.json']);
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					name: 'Bad',
					requiredData: []
				})
			);

			await installer.importEmailTemplates('ely-work');

			expect(mockInsert).not.toHaveBeenCalled();
		});

		it('onConflictDoUpdate-et használ upsert-hez', async () => {
			mockAccess.mockResolvedValue(undefined);
			mockReaddir.mockResolvedValue(['test.json']);
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					name: 'Test',
					locales: {
						hu: { subject: 'S', html: 'H', text: 'T' }
					},
					requiredData: [],
					optionalData: []
				})
			);

			await installer.importEmailTemplates('app-x');

			expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					target: [fakeEmailTemplates.type, fakeEmailTemplates.locale]
				})
			);
		});
	});

	// --- removeEmailTemplates ---

	describe('removeEmailTemplates', () => {
		it('az {appId}: prefixű rekordokat törli', async () => {
			await installer.removeEmailTemplates('ely-work');

			expect(mockDelete).toHaveBeenCalled();
			expect(mockDeleteWhere).toHaveBeenCalledWith(
				expect.objectContaining({
					op: 'like',
					pattern: 'ely-work:%'
				})
			);
		});

		it('különböző pluginId-khoz a megfelelő prefixet használja', async () => {
			await installer.removeEmailTemplates('other-plugin');

			expect(mockDeleteWhere).toHaveBeenCalledWith(
				expect.objectContaining({
					op: 'like',
					pattern: 'other-plugin:%'
				})
			);
		});

		it('hiba esetén nem dob kivételt (graceful)', async () => {
			mockDelete.mockReturnValueOnce({
				where: vi.fn().mockRejectedValue(new Error('DB error'))
			});

			// Nem szabad hibát dobnia
			await expect(installer.removeEmailTemplates('ely-work')).resolves.toBeUndefined();
		});
	});
});
