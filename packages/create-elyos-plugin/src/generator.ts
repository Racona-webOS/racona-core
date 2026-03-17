/**
 * Projekt generátor
 *
 * Template másolás, manifest/package.json/README generálás.
 */

import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import type { PluginConfig, PluginManifest } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateProject(config: PluginConfig): Promise<void> {
	const targetDir = join(process.cwd(), config.pluginId);

	// 1. Ellenőrzés
	if (existsSync(targetDir)) {
		throw new Error(`A "${config.pluginId}" könyvtár már létezik`);
	}

	console.log(pc.dim(`  Projekt létrehozása: ${config.pluginId}`));

	// 2. Template másolás
	const templatesRoot = join(__dirname, '..', 'templates');
	const templateDir = join(templatesRoot, config.template);

	if (!existsSync(templateDir)) {
		throw new Error(`Template nem található: ${config.template}`);
	}

	mkdirSync(targetDir, { recursive: true });
	cpSync(templateDir, targetDir, { recursive: true });

	// 3. Generált fájlok
	writeManifest(targetDir, config);
	writePackageJson(targetDir, config);
	writeReadme(targetDir, config);

	// 4. Dependencies telepítése
	if (config.install) {
		console.log(pc.dim('  Függőségek telepítése...'));
		try {
			execSync('bun install', { cwd: targetDir, stdio: 'pipe' });
		} catch {
			console.log(pc.yellow('  ⚠ bun install sikertelen'));
			console.log(pc.dim('    Az @elyos/sdk nincs npm-en. Állítsd be a package.json-ban:'));
			console.log(pc.dim('    "@elyos/sdk": "file:<útvonal>/elyos-core/packages/sdk"'));
			console.log(pc.dim('    Majd futtasd: bun install'));
		}
	}

	// 5. Siker
	console.log();
	console.log(pc.green('  ✅ Plugin sikeresen létrehozva!'));
	console.log();
	console.log(`  ${pc.bold('Következő lépések:')}`);
	console.log(`  ${pc.cyan(`cd ${config.pluginId}`)}`);
	console.log(`  ${pc.cyan('bun dev')}`);
	console.log();
}

function writeManifest(dir: string, config: PluginConfig): void {
	const manifest: PluginManifest = {
		id: config.pluginId,
		name: { hu: config.displayName, en: config.displayName },
		description: { hu: config.description, en: config.description },
		version: '1.0.0',
		author: config.author,
		entry: 'dist/index.iife.js',
		icon: 'icon.svg',
		iconStyle: 'cover',
		category: 'utilities',
		permissions: config.permissions,
		multiInstance: false,
		defaultSize: { width: 800, height: 600 },
		minSize: { width: 400, height: 300 },
		maxSize: { width: 1920, height: 1080 },
		keywords: [],
		isPublic: true,
		sortOrder: 100,
		dependencies: {
			svelte: '^5.0.0',
			'@lucide/svelte': '^0.561.0'
		},
		minWebOSVersion: '2.0.0',
		locales: ['hu', 'en']
	};

	writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');
}

function writePackageJson(dir: string, config: PluginConfig): void {
	const pkg = {
		name: `${config.pluginId}-plugin`,
		version: '1.0.0',
		description: config.description,
		type: 'module',
		scripts: {
			dev: 'vite',
			'dev:server': 'bun dev-server.ts',
			build: 'vite build',
			'build:watch': 'vite build --watch',
			preview: 'vite preview',
			package: 'bun build-package.js'
		},
		dependencies: {
			// TODO: @elyos/sdk nincs npm-en — ha publikálva lesz, cseréld vissza: '^1.0.0'
			// Az útvonalat igazítsd a saját könyvtárstruktúrádhoz!
			'@elyos/sdk': 'file:../../elyos-core/packages/sdk',
			svelte: '^5.0.0',
			'@lucide/svelte': '^0.561.0'
		},
		devDependencies: {
			'@sveltejs/vite-plugin-svelte': '^5.0.0',
			vite: '^6.0.0',
			typescript: '^5.7.0',
			'vite-plugin-css-injected-by-js': '^4.0.0'
		}
	};

	writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n');
}

function writeReadme(dir: string, config: PluginConfig): void {
	const readme = `# ${config.displayName}

${config.description}

## Fejlesztés

\`\`\`bash
# Standalone mód (Mock SDK)
bun dev

# ElyOS módban
# 1. Indítsd el az ElyOS-t Docker-rel
# 2. Plugin Manager → Load Dev Plugin → http://localhost:5174
\`\`\`

## Build

\`\`\`bash
bun build
\`\`\`

## Struktúra

- \`src/\` — Plugin forráskód (Svelte 5)
- \`locales/\` — Fordítások (hu, en)
- \`assets/\` — Ikonok, képek
${config.template !== 'basic' ? '- `server/` — Szerver oldali függvények\n' : ''}- \`manifest.json\` — Plugin metaadatok
- \`vite.config.ts\` — Build konfiguráció

## License

MIT
`;

	writeFileSync(join(dir, 'README.md'), readme);
}
