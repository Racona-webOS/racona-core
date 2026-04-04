// @ts-nocheck -- Vite verziókonfliktus a bun dependency resolution miatt (vite@7 vs vite@8)
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import devtoolsJson from 'vite-plugin-devtools-json';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
	plugins: [devtoolsJson(), tailwindcss(), enhancedImages(), sveltekit()],
	envDir: '../..',
	server: {
		port: 3000
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.svelte.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		// Enable Svelte runes in test files
		server: {
			deps: {
				inline: ['svelte']
			}
		}
	}
});
