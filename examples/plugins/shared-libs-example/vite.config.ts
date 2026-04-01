import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Example Vite configuration for a plugin using shared libraries.
 *
 * This configuration marks common libraries as external, preventing them
 * from being bundled into the plugin. Instead, they're accessed via the
 * ElyOS SDK at runtime.
 */
export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				runes: true,
				customElement: true,
				css: 'injected'
			}
		})
	],
	build: {
		lib: {
			entry: 'src/main.ts',
			name: 'SharedLibsExamplePlugin',
			formats: ['iife']
		},
		rollupOptions: {
			// Mark shared libraries as external - they won't be bundled
			external: [
				'lucide-svelte',
				'phosphor-svelte',
				'@tanstack/table-core',
				'clsx',
				'tailwind-merge'
			],
			output: {
				entryFileNames: 'index.iife.js',
				inlineDynamicImports: true,
				// Map external imports to SDK globals
				globals: {
					'lucide-svelte': 'window.webOS.libs.lucide',
					'phosphor-svelte': 'window.webOS.libs.phosphor',
					'@tanstack/table-core': 'window.webOS.libs.tanstackTable',
					clsx: 'window.webOS.libs.clsx',
					'tailwind-merge': 'window.webOS.libs.tailwindMerge'
				}
			}
		},
		outDir: 'dist',
		emptyOutDir: true
	}
});
