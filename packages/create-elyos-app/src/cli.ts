#!/usr/bin/env node
/**
 * create-elyos-app CLI
 *
 * Interactive wizard for scaffolding ElyOS app projects.
 *
 * Usage:
 *   bunx @elyos-dev/create-app
 *   bunx @elyos-dev/create-app my-app
 *   bunx @elyos-dev/create-app my-app --template basic --no-install
 */

import { Command } from 'commander';
import { runInteractiveWizard } from './prompts.js';
import { generateProject } from './generator.js';
import pc from 'picocolors';

const program = new Command();

program
	.name('create-elyos-app')
	.description('Create a new ElyOS app project')
	.version('1.0.0')
	.argument('[app-name]', 'App name (kebab-case)')
	.option('-t, --template <template>', 'Template: basic, advanced, datatable, sidebar')
	.option('--no-install', 'Skip dependency installation')
	.action(async (appName?: string, options?: { template?: string; install?: boolean }) => {
		console.log();
		console.log(pc.bold(pc.cyan('  🚀 create-elyos-app')));
		console.log();

		try {
			const config = await runInteractiveWizard(appName, options);
			await generateProject(config);
		} catch (error) {
			if ((error as Error).message?.includes('cancelled')) {
				console.log(pc.yellow('\n  Cancelled.\n'));
				process.exit(0);
			}
			console.error(pc.red(`\n  Error: ${(error as Error).message}\n`));
			process.exit(1);
		}
	});

program.parse();
