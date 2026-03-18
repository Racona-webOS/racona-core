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
