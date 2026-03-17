import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Vite plugin: a gyökér manifest.json-t szinkronizálja a public/ mappába.
 * Így csak egy helyen kell szerkeszteni, a public/manifest.json automatikusan frissül.
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

export default defineConfig(({ command }) => ({
	plugins: [
		syncManifest(),
		svelte({
			compilerOptions: {
				runes: true
			}
		}),
		...(command === 'build' ? [cssInjectedByJs()] : [])
	],
	server: {
		port: 5174,
		cors: true
	},
	...(command === 'build'
		? {
				build: {
					lib: {
						entry: 'src/plugin.ts',
						formats: ['iife'],
						name: 'Plugin',
						fileName: () => 'index.iife.js'
					},
					rollupOptions: {
						output: {
							inlineDynamicImports: true
						}
					}
				}
			}
		: {})
}));
