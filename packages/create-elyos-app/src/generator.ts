/**
 * Project generator
 *
 * Template copying, manifest/package.json/README generation.
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

	// 1. Check
	if (existsSync(targetDir)) {
		throw new Error(`Directory "${config.pluginId}" already exists`);
	}

	console.log(pc.dim(`  Creating project: ${config.pluginId}`));

	// 2. Copy template
	const templatesRoot = join(__dirname, '..', 'templates');
	const templateDir = join(templatesRoot, config.template);

	if (config.template === 'starter') {
		await generateStarterProject(targetDir, config);
	} else {
		if (!existsSync(templateDir)) {
			throw new Error(`Template not found: ${config.template}`);
		}

		mkdirSync(targetDir, { recursive: true });
		cpSync(templateDir, targetDir, { recursive: true });

		// 3. Replace placeholders (sidebar template)
		if (config.template === 'sidebar') {
			replaceTemplatePlaceholders(targetDir, config);
			writeMenuJson(targetDir, config);
		}

		// 4. Generated files
		writeManifest(targetDir, config);
		writePackageJson(targetDir, config);
		writeReadme(targetDir, config);
	}

	// 4. Install dependencies
	if (config.install) {
		console.log(pc.dim('  Installing dependencies...'));
		try {
			execSync('bun install', { cwd: targetDir, stdio: 'pipe' });
		} catch {
			console.log(pc.yellow('  ⚠ bun install failed'));
			console.log(pc.dim('    Set the correct path in package.json:'));
			console.log(pc.dim('    "@elyos-dev/sdk": "^0.1.0"'));
			console.log(pc.dim('    Then run: bun install'));
		}
	}

	// 5. Success
	console.log();
	console.log(pc.green('  ✅ App created successfully!'));
	console.log();
	console.log(`  ${pc.bold('Next steps:')}`);
	console.log(`  ${pc.cyan(`cd ${config.pluginId}`)}`);
	console.log(`  ${pc.cyan('bun dev')}`);
	console.log();
}

/**
 * Replaces sidebar template placeholders in generated files.
 * __PLUGIN_ID__ → config.pluginId
 * __PLUGIN_ID_UNDERSCORE__ → config.pluginId with hyphens replaced by underscores
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
 * Generates menu.json for sidebar template.
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
	const isSidebar =
		config.template === 'sidebar' || (config.template === 'starter' && config.blankSidebar);

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
			'@elyos-dev/sdk': '^0.1.0',
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

## Development

\`\`\`bash
# Standalone mode (Mock SDK)
bun dev

# Inside ElyOS
# 1. Start ElyOS with Docker
# 2. Plugin Manager → Load Dev Plugin → http://localhost:5174
\`\`\`

## Build

\`\`\`bash
bun run build
\`\`\`
${
	isSidebar
		? `
> The \`build\` command runs \`build-all.js\`, which builds the main app and all sidebar components.
`
		: ''
}
## Structure

- \`src/\` — App source code (Svelte 5)
${isSidebar ? '- `src/components/` — Sidebar menu components\n' : ''}- \`locales/\` — Translations (hu, en)
- \`assets/\` — Icons, images
${config.template !== 'basic' ? '- `server/` — Server-side functions\n' : ''}${isSidebar ? '- `menu.json` — Sidebar menu definition\n' : ''}- \`manifest.json\` — App metadata
- \`vite.config.ts\` — Build configuration

## License

MIT
`;

	writeFileSync(join(dir, 'README.md'), readme);
}

/**
 * Blank template: minimális projekt generálása, opcionális funkciókkal.
 */
async function generateStarterProject(targetDir: string, config: PluginConfig): Promise<void> {
	const { blankSidebar, blankRemote, blankI18n } = config;

	// Alap könyvtárstruktúra
	mkdirSync(join(targetDir, 'src'), { recursive: true });
	mkdirSync(join(targetDir, 'assets'), { recursive: true });

	if (blankI18n) {
		mkdirSync(join(targetDir, 'locales'), { recursive: true });
	}
	if (blankRemote) {
		mkdirSync(join(targetDir, 'server'), { recursive: true });
	}
	if (blankSidebar) {
		mkdirSync(join(targetDir, 'src', 'components'), { recursive: true });
	}
	if (config.blankMigrations) {
		mkdirSync(join(targetDir, 'migrations'), { recursive: true });
	}

	// Alap fájlok másolása a basic template-ből (vite.config, dev-server, stb.)
	const templatesRoot = join(__dirname, '..', 'templates');
	const basicDir = join(templatesRoot, 'basic');
	for (const f of [
		'.gitignore',
		'build-package.js',
		'dev-server.ts',
		'index.html',
		'svelte.config.js',
		'tsconfig.json',
		'vite.config.ts'
	]) {
		const src = join(basicDir, f);
		if (existsSync(src)) {
			const { copyFileSync } = await import('node:fs');
			copyFileSync(src, join(targetDir, f));
		}
	}

	// icon.svg
	const iconSrc = join(basicDir, 'assets', 'icon.svg');
	if (existsSync(iconSrc)) {
		const { copyFileSync } = await import('node:fs');
		copyFileSync(iconSrc, join(targetDir, 'assets', 'icon.svg'));
	}

	// App.svelte
	writeFileSync(join(targetDir, 'src', 'App.svelte'), generateBlankAppSvelte(config));

	// main.ts
	writeFileSync(join(targetDir, 'src', 'main.ts'), generateBlankMainTs(config));

	// sidebar komponensek
	if (blankSidebar) {
		writeFileSync(
			join(targetDir, 'src', 'components', 'Overview.svelte'),
			generateBlankOverviewSvelte()
		);
		writeMenuJson(targetDir, config);
	}

	// server/functions.ts
	if (blankRemote) {
		writeFileSync(
			join(targetDir, 'server', 'functions.ts'),
			`/**\n * Szerver oldali függvények\n */\n\nexport async function example(): Promise<{ result: string }> {\n\treturn { result: 'Hello from server!' };\n}\n`
		);
	}

	// locales
	if (blankI18n) {
		writeFileSync(
			join(targetDir, 'locales', 'hu.json'),
			JSON.stringify({ title: config.displayName }, null, '\t') + '\n'
		);
		writeFileSync(
			join(targetDir, 'locales', 'en.json'),
			JSON.stringify({ title: config.displayName }, null, '\t') + '\n'
		);
	}

	// migrations/001_init.sql
	if (config.blankMigrations) {
		const pluginIdUnderscore = config.pluginId.replace(/-/g, '_');
		writeFileSync(
			join(targetDir, 'migrations', '001_init.sql'),
			`-- ${config.pluginId} kezdeti séma
-- A táblaneveket a telepítő automatikusan prefixeli a plugin sémájával (plugin__${pluginIdUnderscore})
-- Nem kell séma prefixet írni — az ElyOS installer automatikusan hozzáadja.

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_created_at ON items (created_at);
`
		);
	}

	// manifest, package.json, README
	writeManifest(targetDir, config);
	writePackageJson(targetDir, config);
	writeBlankReadme(targetDir, config);
}

function generateBlankAppSvelte(config: PluginConfig): string {
	const { blankI18n, blankRemote, blankSidebar } = config;

	const sdkLines: string[] = ['const sdk = window.webOS;'];
	if (blankRemote) {
		sdkLines.push('');
		sdkLines.push('\tasync function callExample() {');
		sdkLines.push("\t\tconst result = await sdk?.remote.call<{ result: string }>('example');");
		sdkLines.push("\t\tsdk?.ui.toast(result?.result ?? 'No response', 'info');");
		sdkLines.push('\t}');
	}

	const titleExpr = blankI18n
		? "sdk?.i18n.t('title') ?? '" + config.displayName + "'"
		: `'${config.displayName}'`;

	let template = '';
	if (blankSidebar) {
		template = `\t<p>Select a menu item from the sidebar.</p>`;
	} else if (blankRemote) {
		template = `\t<h1>{${titleExpr}}</h1>\n\t<button onclick={callExample}>Call server</button>`;
	} else {
		template = `\t<h1>{${titleExpr}}</h1>`;
	}

	return `<script lang="ts">
\t${sdkLines.join('\n')}
</script>

<div class="app">
${template}
</div>

<style>
\t.app {
\t\tpadding: 2rem;
\t\tfont-family: system-ui, sans-serif;
\t}
</style>
`;
}

function generateBlankMainTs(config: PluginConfig): string {
	const { blankI18n } = config;

	const i18nInit = blankI18n
		? `\t\t\ti18n: {\n\t\t\t\tlocale: 'en',\n\t\t\t\ttranslations: {\n\t\t\t\t\ten: { title: '${config.displayName}' },\n\t\t\t\t\thu: { title: '${config.displayName}' }\n\t\t\t\t}\n\t\t\t}`
		: '';

	return `import { mount } from 'svelte';
import App from './App.svelte';

async function initDevSDK() {
\tif (typeof window !== 'undefined' && !window.webOS) {
\t\tconst { MockWebOSSDK } = await import('@elyos/sdk/dev');
\t\tMockWebOSSDK.initialize({${blankI18n ? `\n${i18nInit}\n\t\t` : ''}});
\t}
}

async function init() {
\tawait initDevSDK();
\tconst target = document.getElementById('app');
\tif (target) mount(App, { target });
}

init();
export default App;
`;
}

function generateBlankOverviewSvelte(): string {
	return `<script lang="ts">
\tconst sdk = window.webOS;
</script>

<div class="page">
\t<h2>Overview</h2>
\t<p>Your content here.</p>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
}

function writeBlankReadme(dir: string, config: PluginConfig): void {
	const { blankSidebar, blankRemote, blankI18n } = config;

	const structure = [
		'- `src/App.svelte` — fő komponens',
		'- `src/main.ts` — belépési pont',
		blankSidebar ? '- `src/components/` — oldalsáv komponensek' : '',
		blankRemote ? '- `server/functions.ts` — szerver oldali függvények' : '',
		blankI18n ? '- `locales/` — fordítások (hu, en)' : '',
		'- `assets/icon.svg` — alkalmazás ikon',
		'- `manifest.json` — alkalmazás metaadatok',
		'- `vite.config.ts` — build konfiguráció'
	]
		.filter(Boolean)
		.join('\n');

	writeFileSync(
		join(dir, 'README.md'),
		`# ${config.displayName}

${config.description || 'ElyOS alkalmazás.'}

## Fejlesztés

\`\`\`bash
bun dev
\`\`\`

## Build

\`\`\`bash
bun run build
\`\`\`

## Struktúra

${structure}

## Licenc

MIT
`
	);
}
