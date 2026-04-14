// Feature: racona-brand-migration, Property 1: @racona/* csomagok repository URL konzisztenciája
// Validates: Requirements 1.6

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import * as fc from 'fast-check';
import { describe, it } from 'vitest';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Beolvassa a megadott csomagnévhez tartozó package.json fájlt.
 * A monorepo gyökeréhez képest relatív útvonalakat használ.
 */
function readPackageJson(pkgName: string): Record<string, unknown> {
	const pkgMap: Record<string, string> = {
		'@racona/cli': resolve(__dirname, '../../../../../../packages/create-elyos-app/package.json'),
		'@racona/sdk': resolve(__dirname, '../../../../../../packages/sdk/package.json')
	};

	const filePath = pkgMap[pkgName];
	if (!filePath) {
		throw new Error(`Ismeretlen csomag: ${pkgName}`);
	}

	const content = readFileSync(filePath, 'utf-8');
	return JSON.parse(content) as Record<string, unknown>;
}

describe('Property 1: @racona/* csomagok repository URL konzisztenciája', () => {
	it('Property: minden @racona/ scope-ú csomag repository.url-je tartalmazza a "racona" szót', () => {
		fc.assert(
			fc.property(fc.constantFrom('@racona/cli', '@racona/sdk'), (pkgName) => {
				const pkg = readPackageJson(pkgName);
				const repository = pkg.repository as { url?: string } | undefined;
				return (
					repository !== undefined &&
					typeof repository.url === 'string' &&
					repository.url.includes('racona')
				);
			}),
			{ numRuns: 100 }
		);
	});
});
