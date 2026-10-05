/**
 * Unit tesztek a 'scheduler' feature által generált fájlokhoz.
 * A projekteket egy ideiglenes mappába generálja, a server/jobs.ts handlert
 * JavaScriptre fordítva, csonk kontextussal le is futtatja.
 * Feature: plugin-scheduler (9.2, 9.3)
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { EXAMPLE_SCHEDULED_JOB, generateProject, normalizeFeatures } from '../generator.js';
import type { PluginFeature, PluginManifest } from '../types.js';

const PROJECTS: Record<string, PluginFeature[]> = {
	'jobs-only': ['scheduler'],
	'jobs-db': ['scheduler', 'database', 'sidebar', 'i18n'],
	'remote-db': ['remote_functions', 'database', 'sidebar'],
	'remote-only': ['remote_functions']
};

let workDir: string;
let originalCwd: string;

function read(pluginId: string, file: string): string {
	return readFileSync(join(workDir, pluginId, file), 'utf-8');
}

function readManifest(pluginId: string): PluginManifest {
	return JSON.parse(read(pluginId, 'manifest.json'));
}

/** Szintaktikai hibák a generált TypeScript forrásban (típusellenőrzés nélkül). */
function syntaxErrors(source: string, fileName: string): string[] {
	const { diagnostics } = ts.transpileModule(source, {
		fileName,
		reportDiagnostics: true,
		compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
	});
	return (diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

type Handler = (params: unknown, context: unknown) => Promise<{ summary?: string; data?: any }>;

/** A generált server/jobs.ts lefordítása és betöltése. */
async function loadJobs(pluginId: string): Promise<Record<string, Handler>> {
	const { outputText } = ts.transpileModule(read(pluginId, 'server/jobs.ts'), {
		compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
	});
	const outFile = join(workDir, `${pluginId}-jobs.mjs`);
	writeFileSync(outFile, outputText);
	return import(pathToFileURL(outFile).href);
}

interface FakeQuery {
	sql: string;
	params?: unknown[];
}

function stubContext(overrides: Record<string, unknown> = {}) {
	const logs: Array<{ level: string; message: string }> = [];
	const log = (level: string) => (message: string) => logs.push({ level, message });
	const context = {
		pluginId: 'jobs-db',
		userId: null,
		trigger: 'manual',
		triggeredBy: null,
		db: {
			query: async () => {
				throw new Error('no database');
			},
			connect: async () => {
				throw new Error('no database');
			}
		},
		permissions: [],
		pluginPermissions: ['scheduler', 'remote_functions'],
		logger: { info: log('info'), warn: log('warn'), error: log('error') },
		signal: new AbortController().signal,
		...overrides
	};
	return { context, logs };
}

/** Csonk db: a SELECT a megadott sorokat adja, az UPDATE mindig egy sort módosít. */
function fakeDb(rows: Array<{ id: number; name: string }>) {
	const queries: FakeQuery[] = [];
	return {
		queries,
		db: {
			query: async (sql: string, params?: unknown[]) => {
				queries.push({ sql, params });
				if (/^\s*SELECT/i.test(sql)) return { rows, rowCount: rows.length };
				return { rows: [], rowCount: 1 };
			},
			connect: async () => {
				throw new Error('not used');
			}
		}
	};
}

const params = (extra: Record<string, unknown> = {}) => ({
	jobId: 'daily-check',
	runId: 1,
	scheduledFor: '2026-03-14T23:30:00.000Z',
	trigger: 'schedule',
	...extra
});

beforeAll(async () => {
	originalCwd = process.cwd();
	workDir = mkdtempSync(join(tmpdir(), 'racona-cli-scheduler-'));
	process.chdir(workDir);
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	try {
		for (const [pluginId, features] of Object.entries(PROJECTS)) {
			await generateProject({
				pluginId,
				displayName: pluginId,
				description: 'Test',
				author: 'Test <test@example.com>',
				features: normalizeFeatures(features),
				install: false
			});
		}
	} finally {
		logSpy.mockRestore();
	}
});

afterAll(() => {
	process.chdir(originalCwd);
	rmSync(workDir, { recursive: true, force: true });
});

// --- manifest.json ---

describe('manifest.json', () => {
	it('scheduler esetén tartalmazza a minta feladatot és a "scheduler" jogot', () => {
		for (const pluginId of ['jobs-only', 'jobs-db']) {
			const manifest = readManifest(pluginId);
			expect(manifest.permissions).toContain('scheduler');
			expect(manifest.permissions).toContain('remote_functions');
			expect(manifest.scheduledJobs).toEqual([EXAMPLE_SCHEDULED_JOB]);
		}
	});

	it('scheduler nélkül nincs scheduledJobs mező és "scheduler" jog', () => {
		for (const pluginId of ['remote-db', 'remote-only']) {
			const manifest = readManifest(pluginId);
			expect(manifest).not.toHaveProperty('scheduledJobs');
			expect(manifest.permissions).not.toContain('scheduler');
		}
	});
});

// --- server/jobs.ts ---

describe('server/jobs.ts', () => {
	it('csak scheduler esetén jön létre', () => {
		expect(existsSync(join(workDir, 'jobs-only', 'server', 'jobs.ts'))).toBe(true);
		expect(existsSync(join(workDir, 'jobs-db', 'server', 'jobs.ts'))).toBe(true);
		expect(existsSync(join(workDir, 'remote-db', 'server', 'jobs.ts'))).toBe(false);
		expect(existsSync(join(workDir, 'remote-only', 'server', 'jobs.ts'))).toBe(false);
	});

	it('az SDK típussal deklarálja a manifestben hivatkozott handlert', () => {
		const source = read('jobs-db', 'server/jobs.ts');
		expect(source).toContain("from '@racona/sdk/server'");
		expect(source).toContain(`export const ${EXAMPLE_SCHEDULED_JOB.handler}: ScheduledJobHandler`);
		expect(source).toContain(`const TIME_ZONE = '${EXAMPLE_SCHEDULED_JOB.timezone}'`);
		expect(syntaxErrors(source, 'jobs.ts')).toEqual([]);
		expect(syntaxErrors(read('jobs-only', 'server/jobs.ts'), 'jobs.ts')).toEqual([]);
	});

	it('a handler nem kerül a remote végpont által betöltött server/functions.ts-be', () => {
		for (const pluginId of ['jobs-only', 'jobs-db']) {
			expect(read(pluginId, 'server/functions.ts')).not.toContain(EXAMPLE_SCHEDULED_JOB.handler);
		}
	});

	it('database nélkül lefut, summary-t ad, és a futás idejét a feladat időzónája szerint veszi', async () => {
		const jobs = await loadJobs('jobs-only');
		const { context, logs } = stubContext();
		// 2026-03-14T23:30Z = 2026-03-15 00:30 Budapesten
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-03-14T23:30:00.000Z'));
		try {
			const result = await jobs[EXAMPLE_SCHEDULED_JOB.handler](params(), context);
			expect(result.summary).toBe('0 item(s) processed');
			expect(result.data.today).toBe('2026-03-15');
			expect(logs.some((l) => l.level === 'info')).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	// Egy pótló futás scheduledFor-ja az első kimaradt időpont; a feldolgozás a mai napig tart
	it('pótló futásnál a mai napig dolgoz fel, nem a scheduledFor napjáig', async () => {
		const jobs = await loadJobs('jobs-only');
		const { context } = stubContext();
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-03-18T06:00:30.000Z'));
		try {
			const result = await jobs[EXAMPLE_SCHEDULED_JOB.handler](
				params({ scheduledFor: '2026-03-15T06:00:00.000Z' }),
				context
			);
			expect(result.data.today).toBe('2026-03-18');
		} finally {
			vi.useRealTimers();
		}
	});

	it('a params.today felülírja a feldolgozandó napot', async () => {
		const jobs = await loadJobs('jobs-only');
		const { context } = stubContext();
		const result = await jobs[EXAMPLE_SCHEDULED_JOB.handler](params({ today: '2026-01-31' }), context);
		expect(result.data.today).toBe('2026-01-31');
	});

	it('database esetén a még nem ellenőrzött, esedékes tételeket dolgozza fel, idempotens UPDATE-tel', async () => {
		const jobs = await loadJobs('jobs-db');
		const { db, queries } = fakeDb([
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' }
		]);
		const { context } = stubContext({ db });
		const result = await jobs[EXAMPLE_SCHEDULED_JOB.handler](params({ today: '2026-01-31' }), context);

		expect(result.summary).toBe('2 item(s) processed');
		expect(result.data).toEqual({ today: '2026-01-31', due: 2, processed: 2 });

		const [select, ...updates] = queries;
		expect(select.sql).toContain('app__jobs_db.items');
		expect(select.sql).toContain('checked_at IS NULL');
		expect(select.params).toEqual(['2026-01-31', EXAMPLE_SCHEDULED_JOB.timezone]);
		expect(updates).toHaveLength(2);
		for (const update of updates) expect(update.sql).toContain('AND checked_at IS NULL');
	});

	it('megszakított jel esetén nem dolgoz fel több tételt, és figyelmeztetést naplóz', async () => {
		const jobs = await loadJobs('jobs-db');
		const { db, queries } = fakeDb([{ id: 1, name: 'a' }]);
		const controller = new AbortController();
		controller.abort();
		const { context, logs } = stubContext({ db, signal: controller.signal });
		const result = await jobs[EXAMPLE_SCHEDULED_JOB.handler](params(), context);

		expect(result.data.processed).toBe(0);
		expect(queries).toHaveLength(1);
		expect(logs.some((l) => l.level === 'warn')).toBe(true);
	});
});

// --- migrations ---

describe('migrations/001_init.sql', () => {
	it('scheduler + database esetén tartalmazza a checked_at oszlopot', () => {
		expect(read('jobs-db', 'migrations/001_init.sql')).toMatch(/checked_at TIMESTAMP WITH TIME ZONE/);
	});

	it('scheduler nélkül nem változik', () => {
		expect(read('remote-db', 'migrations/001_init.sql')).not.toContain('checked_at');
	});
});

// --- dev-server.ts ---

describe('dev-server.ts', () => {
	it('scheduler esetén POST /api/jobs/:jobId/run végpontot ad, a manifestből és a server/jobs.ts-ből', () => {
		for (const pluginId of ['jobs-only', 'jobs-db']) {
			const source = read(pluginId, 'dev-server.ts');
			expect(source).toContain('JOB_RUN_PATH');
			expect(source).toContain("import('./server/jobs.ts')");
			expect(source).toContain("join(ROOT, 'manifest.json')");
			expect(source).toContain("url.searchParams.get('today')");
			expect(source).toContain('userId: null');
			expect(source).toContain("trigger: 'manual'");
			expect(source).toContain('permissions: []');
			expect(source).toContain('signal: controller.signal');
			expect(syntaxErrors(source, 'dev-server.ts')).toEqual([]);
		}
	});

	it('a végpont útvonal mintája a jobId-t adja vissza', () => {
		const source = read('jobs-only', 'dev-server.ts');
		const match = source.match(/const JOB_RUN_PATH = (\/.+\/);/);
		expect(match).not.toBeNull();
		const pattern = new Function(`return ${match![1]}`)() as RegExp;
		expect('/api/jobs/daily-check/run'.match(pattern)?.[1]).toBe('daily-check');
		expect(pattern.test('/api/jobs/daily-check/run/extra')).toBe(false);
		expect(pattern.test('/api/jobs//run')).toBe(false);
	});

	it('database nélkül a db csonk hibát dob, database esetén a pool-t használja', () => {
		const withoutDb = read('jobs-only', 'dev-server.ts');
		expect(withoutDb).toContain('buildContext()');
		expect(withoutDb).toContain('without the database feature');
		expect(withoutDb).toContain("const PLUGIN_ID = 'jobs-only'");
		expect(read('jobs-db', 'dev-server.ts')).toContain('buildContext(pool)');
	});

	it('scheduler nélkül nincs jobs végpont', () => {
		for (const pluginId of ['remote-db', 'remote-only']) {
			const source = read(pluginId, 'dev-server.ts');
			expect(source).not.toContain('/api/jobs/');
			expect(syntaxErrors(source, 'dev-server.ts')).toEqual([]);
		}
	});

	it('a remote kontextus email és notifications csonkot is ad (mint a core)', () => {
		const source = read('remote-db', 'dev-server.ts');
		expect(source).toContain('[email.send stub]');
		expect(source).toContain('[notifications.send stub]');
	});
});

// --- build ---

describe('build-all.js', () => {
	it('nem fordítja a server/ mappát dist/server-be (a core a server/ forrást tölti be)', () => {
		for (const pluginId of ['jobs-db', 'remote-db']) {
			const source = read(pluginId, 'build-all.js');
			expect(source).not.toMatch(/\btsc\b/);
			expect(source).not.toContain('dist/server');
		}
	});
});

describe('build-package.js', () => {
	it('becsomagolja a server/ és email-templates/ mappát', () => {
		const source = read('jobs-db', 'build-package.js');
		expect(source).toContain("entries.push('server')");
		expect(source).toContain("entries.push('email-templates')");
	});
});
