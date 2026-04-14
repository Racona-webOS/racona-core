import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Vite plugin: a gyökér manifest.json-t szinkronizálja a public/ mappába.
 */
function syncManifest() {
	return {
		name: 'sync-manifest',
		buildStart() {
			const src = resolve(__dirname, 'manifest.json');
			const dest = resolve(__dirname, 'public/manifest.json');
			mkdirSync(resolve(__dirname, 'public'), { recursive: true });
			copyFileSync(src, dest);
		}
	};
}

const buildMode = process.env.BUILD_MODE || 'main';
const componentsDir = resolve(__dirname, 'src/components');
const hasComponents = existsSync(componentsDir);

let entry: string;
let fileName: string;

if (buildMode === 'components' && hasComponents) {
	const componentFile = process.env.COMPONENT_FILE;
	if (componentFile) {
		entry = resolve(componentsDir, componentFile);
		fileName = `components/${componentFile.replace('.svelte', '')}`;
	} else {
		throw new Error('COMPONENT_FILE environment variable is required for components build');
	}
} else {
	entry = 'src/plugin.ts';
	fileName = 'index';
}

export default defineConfig(({ command }) => ({
	plugins: [
		syncManifest(),
		svelte({
			onwarn(warning, handler) {
				// Suppress known non-issues in plugin builds
				if (warning.code === 'options_missing_custom_element') return;
				if (warning.code === 'state_referenced_locally') return;
				handler(warning);
			},
			compilerOptions: {
				runes: true,
				...(command === 'build'
					? {
							customElement: true,
							css: 'injected'
						}
					: {})
			}
		}),
		...(command === 'build' && buildMode === 'main' ? [cssInjectedByJs()] : [])
	],
	server: {
		port: 5174,
		cors: true
	},
	...(command === 'build'
		? {
				build: {
					lib: {
						entry,
						name: 'Plugin',
						formats: ['iife']
					},
					rollupOptions: {
						output: {
							entryFileNames: `${fileName}.iife.js`,
							inlineDynamicImports: true
						}
					},
					outDir: 'dist',
					emptyOutDir: buildMode === 'main'
				}
			}
		: {})
}));
