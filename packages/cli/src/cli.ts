#!/usr/bin/env node
/**
 * create-elyos-app CLI
 *
 * Interactive wizard for scaffolding ElyOS app projects.
 *
 * Usage:
 *   bunx @elyos-dev/create-app
 *   bunx @elyos-dev/create-app my-app
 *   bunx @elyos-dev/create-app my-app --features sidebar,database
 *   bunx @elyos-dev/create-app my-app --template basic --no-install
 */

import { Command } from 'commander';
import { runInteractiveWizard } from './prompts.js';
import { generateProject, normalizeFeatures } from './generator.js';
import type { PluginFeature } from './types.js';
import pc from 'picocolors';

const VALID_FEATURES = new Set<PluginFeature>([
	'sidebar',
	'database',
	'remote_functions',
	'datatable',
	'notifications',
	'i18n'
]);

/**
 * Parses a comma-separated feature string into a PluginFeature array.
 * Throws for unknown feature names.
 * Returns [] for empty string.
 */
export function parseFeatures(raw: string): PluginFeature[] {
	if (!raw.trim()) return [];

	const parts = raw.split(',').map((s) => s.trim());
	const validList = Array.from(VALID_FEATURES).join(', ');

	for (const part of parts) {
		if (part === '') continue; // skip empty segments from trailing/leading commas
		if (!VALID_FEATURES.has(part as PluginFeature)) {
			throw new Error(`Unknown feature: "${part}". Valid features: ${validList}`);
		}
	}

	const result = parts.filter(Boolean) as PluginFeature[];
	if (result.length === 0 && raw.trim().length > 0) {
		throw new Error(`Unknown feature: "${raw.trim()}". Valid features: ${validList}`);
	}
	return result;
}

/**
 * Template preset mappings — maps legacy --template values to feature arrays.
 */
export const TEMPLATE_PRESETS: Record<string, PluginFeature[]> = {
	basic: [],
	advanced: ['remote_functions', 'database'],
	sidebar: ['sidebar', 'remote_functions', 'database'],
	datatable: ['datatable', 'remote_functions', 'database'],
	starter: ['i18n']
};

const program = new Command();

program
	.name('create-elyos-app')
	.description('Create a new ElyOS app project')
	.version('1.0.0')
	.argument('[app-name]', 'App name (kebab-case)')
	.option(
		'-t, --template <template>',
		'Template: basic, advanced, datatable, sidebar (deprecated — use --features)'
	)
	.option(
		'--features <features>',
		'Comma-separated feature list: sidebar, database, remote_functions, datatable, notifications, i18n'
	)
	.option('--no-install', 'Skip dependency installation')
	.action(
		async (
			appName?: string,
			options?: { template?: string; features?: string; install?: boolean }
		) => {
			console.log();
			console.log(pc.bold(pc.cyan('  🚀 create-elyos-app')));
			console.log();

			try {
				let resolvedFeatures: PluginFeature[] | undefined;

				// Conflict check: --template + --features together is not allowed
				if (options?.template && options?.features) {
					console.error(
						pc.red(
							'  Error: --template and --features cannot be used together. Use --features only.'
						)
					);
					process.exit(1);
				}

				if (options?.template) {
					const preset = TEMPLATE_PRESETS[options.template];
					if (!preset) {
						const validTemplates = Object.keys(TEMPLATE_PRESETS).join(', ');
						console.error(
							pc.red(
								`  Error: Unknown template "${options.template}". Valid templates: ${validTemplates}`
							)
						);
						process.exit(1);
					}

					// Deprecated warning with equivalent --features value
					const equivalentFeatures = preset.length > 0 ? preset.join(',') : '(none)';
					console.log(pc.yellow(`  ⚠ --template is deprecated. Use --features instead.`));
					console.log(pc.yellow(`    Equivalent: --features ${equivalentFeatures}`));
					console.log();

					resolvedFeatures = normalizeFeatures(preset);
				} else if (options?.features !== undefined) {
					resolvedFeatures = normalizeFeatures(parseFeatures(options.features));
				}

				const config = await runInteractiveWizard(appName, {
					features: resolvedFeatures,
					install: options?.install
				});
				await generateProject(config);
			} catch (error) {
				if ((error as Error).message?.includes('cancelled')) {
					console.log(pc.yellow('\n  Cancelled.\n'));
					process.exit(0);
				}
				console.error(pc.red(`\n  Error: ${(error as Error).message}\n`));
				process.exit(1);
			}
		}
	);

program.parse();
