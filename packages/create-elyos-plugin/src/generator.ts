/**
 * Projekt generátor
 *
 * Template másolás, manifest/package.json/README generálás.
 */

import {
	existsSync,
	mkdirSync,
	cpSync,
	writeFileSync,
	readdirSync,
	readFileSync,
	statSync
} from 'node:fs';
import { join, dirname, extname } from 'node:path';
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

	// 3. Placeholder csere (sidebar template)
	if (config.template === 'sidebar') {
		replaceTemplatePlaceholders(targetDir, config);
		writeMenuJson(targetDir, config);
	}

	// 4. Generált fájlok
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

/**
 * Sidebar template placeholder-ek cseréje a generált fájlokban.
 * __PLUGIN_ID__ → config.pluginId
 * __PLUGIN_ID_UNDERSCORE__ → config.pluginId kötőjelek nélkül (underscore)
 */
function replaceTemplatePlaceholders(targetDir: string, config: PluginConfig): void {
	const pluginIdUnderscore = config.pluginId.replace(/-/g, '_');
	const replaceable = new Set(['.svelte', '.ts', '.js', '.json']);

	function walkAndReplace(dir: string): void {
		for (const entry of readdirSync(dir)) {
			const fullPath = join(dir, entry);
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				if (entry === 'node_modules') continue;
				walkAndReplace(fullPath);
			} else if (replaceable.has(extname(entry))) {
				let content = readFileSync(fullPath, 'utf-8');
				const original = content;
				content = content.replaceAll('__PLUGIN_ID_UNDERSCORE__', pluginIdUnderscore);
				content = content.replaceAll('__PLUGIN_ID__', config.pluginId);
				if (content !== original) {
					writeFileSync(fullPath, content);
				}
			}
		}
	}

	walkAndReplace(targetDir);
}

/**
 * menu.json generálás sidebar template-hez.
 */
function writeMenuJson(dir: string, config: PluginConfig): void {
	// A labelKey csak a namespace utáni rész — a localization.ts maga fűzi elé a namespace-t
	const menu = [
		{
			labelKey: 'menu.overview',
			href: '#overview',
			icon: 'Info',
			component: 'Overview'
		},
		{
			labelKey: 'menu.settings',
			href: '#settings',
			icon: 'Settings',
			component: 'Settings'
		}
	];

	writeFileSync(join(dir, 'menu.json'), JSON.stringify(menu, null, '\t') + '\n');
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
	const isSidebar = config.template === 'sidebar';

	const pkg = {
		name: `${config.pluginId}-plugin`,
		version: '1.0.0',
		description: config.description,
		type: 'module',
		scripts: {
			dev: 'vite',
			'dev:server': 'bun dev-server.ts',
			build: isSidebar ? 'bun build-all.js' : 'vite build',
			'build:watch': 'vite build --watch',
			preview: 'vite preview',
			package: 'bun build-package.js',
			...(isSidebar ? { 'build:all': 'bun build-all.js' } : {})
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
	const isSidebar = config.template === 'sidebar';

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
bun run build
\`\`\`
${
	isSidebar
		? `
> A \`build\` parancs a \`build-all.js\` scriptet futtatja, ami a fő plugint és az összes sidebar komponenst is build-eli.
`
		: ''
}
## Struktúra

- \`src/\` — Plugin forráskód (Svelte 5)
${isSidebar ? '- `src/components/` — Sidebar menüpontok komponensei\n' : ''}- \`locales/\` — Fordítások (hu, en)
- \`assets/\` — Ikonok, képek
${config.template !== 'basic' ? '- `server/` — Szerver oldali függvények\n' : ''}${isSidebar ? '- `menu.json` — Sidebar menü definíció\n' : ''}- \`manifest.json\` — Plugin metaadatok
- \`vite.config.ts\` — Build konfiguráció

## License

MIT
`;

	writeFileSync(join(dir, 'README.md'), readme);
}
