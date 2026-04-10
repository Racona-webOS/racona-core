import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import devtoolsJson from 'vite-plugin-devtools-json';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { validateSchema } from './src/lib/secrets/schema.js';

/**
 * Vite plugin: dev módban betölti a .env.local-t és lefuttatja a séma validációt.
 * Így az app:dev script is ellenőrzi a környezeti változókat indításkor.
 */
function envSchemaValidatorPlugin() {
	return {
		name: 'env-schema-validator',
		buildStart() {
			const envPath = path.resolve(__dirname, '../../.env.local');
			const result = dotenvConfig({ path: envPath, override: false });
			const env = { ...process.env, ...(result.parsed ?? {}) };
			try {
				validateSchema(env as Record<string, unknown>);
				console.log('[env-schema] ✓ Környezeti változók validációja sikeres');
			} catch (err) {
				console.error((err as Error).message);
				process.exit(1);
			}
		}
	};
}

export default defineConfig({
	plugins: [
		envSchemaValidatorPlugin(),
		devtoolsJson(),
		tailwindcss(),
		enhancedImages(),
		sveltekit()
	],
	envDir: '../..',
	server: {
		port: 3000,
		watch: {
			ignored: ['**/uploads/plugins/**', '**/uploads/plugins-temp/**']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.svelte.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		server: {
			deps: {
				inline: ['svelte']
			}
		}
	}
});
