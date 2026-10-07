// @vitest-environment node
/**
 * A plugin csomag knowledge-base/ és help/ mappájának ellenőrzése.
 */

import { describe, it, expect, afterAll } from 'vitest';
import AdmZip from 'adm-zip';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { zipValidator } from './ZipValidator';

const dirs: string[] = [];

async function makePackage(files: Record<string, string | Buffer>): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'zip-kb-'));
	dirs.push(dir);
	const zip = new AdmZip();
	zip.addFile('manifest.json', Buffer.from('{}'));
	for (const [name, content] of Object.entries(files)) {
		zip.addFile(name, Buffer.isBuffer(content) ? content : Buffer.from(content));
	}
	const filePath = path.join(dir, 'plugin.raconapkg');
	zip.writeZip(filePath);
	return filePath;
}

afterAll(async () => {
	await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('ZipValidator — knowledge-base/', () => {
	it('elfogadja a markdown fájlokat', async () => {
		const result = await zipValidator.validate(
			await makePackage({ 'knowledge-base/hu/a.md': '# A', 'knowledge-base/en/b.mdx': '# B' })
		);
		expect(result.valid).toBe(true);
	});

	it('elutasítja a nem markdown fájlt', async () => {
		const result = await zipValidator.validate(
			await makePackage({ 'knowledge-base/hu/script.js': 'alert(1)' })
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain('knowledge-base/hu/script.js');
	});

	it('elutasítja a 2 MB-nál nagyobb tudásbázist', async () => {
		// Változatos tartalom, hogy a tömörítési arány ellenőrzése ne akadjon be
		const big = Buffer.from(
			Array.from({ length: 2.2 * 1024 * 1024 }, (_, i) =>
				String.fromCharCode(97 + ((i * 7919) % 26))
			).join('')
		);
		const result = await zipValidator.validate(
			await makePackage({ 'knowledge-base/hu/big.md': big })
		);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.message.includes('maximum size'))).toBe(true);
	});

	it('a knowledge-base mappán kívüli fájlokat nem korlátozza', async () => {
		const result = await zipValidator.validate(await makePackage({ 'assets/icon.png': 'x' }));
		expect(result.valid).toBe(true);
	});
});

describe('ZipValidator — help/', () => {
	it('elfogadja a markdown oldalakat és a képeket', async () => {
		const result = await zipValidator.validate(
			await makePackage({
				'help/hu/index.md': '# Súgó',
				'help/en/index.md': '# Help',
				'help/assets/screen.webp': 'x',
				'help/assets/diagram.svg': '<svg/>'
			})
		);
		expect(result.valid).toBe(true);
	});

	it('elutasítja a nem megengedett fájltípust', async () => {
		const result = await zipValidator.validate(
			await makePackage({ 'help/hu/page.html': '<script>alert(1)</script>' })
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain('help/hu/page.html');
	});
});
