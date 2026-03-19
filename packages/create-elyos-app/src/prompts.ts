/**
 * Interactive prompts for app scaffolding.
 */

import prompts from 'prompts';
import type { PluginConfig } from './types.js';

function validateAppId(value: string): boolean | string {
	if (!value) return 'App ID is required';
	if (!/^[a-z][a-z0-9-]*$/.test(value)) {
		return 'Only lowercase letters, numbers and hyphens (kebab-case)';
	}
	if (value.length < 2) return 'Minimum 2 characters';
	if (value.length > 50) return 'Maximum 50 characters';
	return true;
}

function toTitleCase(str: string): string {
	return str
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

export async function runInteractiveWizard(
	initialName?: string,
	options?: { template?: string; install?: boolean }
): Promise<PluginConfig> {
	const questions: prompts.PromptObject[] = [];

	if (!initialName) {
		questions.push({
			type: 'text',
			name: 'pluginId',
			message: 'App ID (kebab-case):',
			validate: validateAppId
		});
	} else {
		const valid = validateAppId(initialName);
		if (valid !== true) {
			throw new Error(valid as string);
		}
	}

	questions.push(
		{
			type: 'text',
			name: 'displayName',
			message: 'Display name:',
			initial: toTitleCase(initialName ?? '')
		},
		{
			type: 'text',
			name: 'description',
			message: 'Description:'
		},
		{
			type: 'text',
			name: 'author',
			message: 'Author (Name <email>):'
		}
	);

	if (!options?.template) {
		questions.push({
			type: 'select',
			name: 'template',
			message: 'Template:',
			choices: [
				{
					title: 'Starter',
					value: 'starter',
					description: 'Clean slate — only SDK, you choose what to add'
				},
				{ title: 'Basic', value: 'basic', description: 'Simple app with UI' },
				{ title: 'Advanced', value: 'advanced', description: 'With server functions' },
				{ title: 'Sidebar', value: 'sidebar', description: 'With sidebar menu (layout mode)' },
				{ title: 'DataTable', value: 'datatable', description: 'CRUD with DataTable' }
			],
			initial: 0
		});
	}

	questions.push({
		type: 'multiselect',
		name: 'permissions',
		message: 'Permissions:',
		choices: [
			{ title: 'Database', value: 'database', selected: true },
			{ title: 'Notifications', value: 'notifications' },
			{ title: 'Remote Functions', value: 'remote_functions', selected: true }
		]
	});

	const answers = await prompts(questions, {
		onCancel: () => {
			throw new Error('cancelled');
		}
	});

	const selectedTemplate = (options?.template ??
		answers.template ??
		'starter') as PluginConfig['template'];

	// starter template: follow-up kérdések
	let blankSidebar = false;
	let blankRemote = false;
	let blankI18n = false;
	let blankMigrations = false;

	if (selectedTemplate === 'starter') {
		const blankAnswers = await prompts(
			[
				{
					type: 'toggle',
					name: 'sidebar',
					message: 'Add sidebar navigation? (menu.json + components/)',
					initial: false,
					active: 'yes',
					inactive: 'no'
				},
				{
					type: 'toggle',
					name: 'remote',
					message: 'Add server functions? (server/functions.ts)',
					initial: false,
					active: 'yes',
					inactive: 'no'
				},
				{
					type: 'toggle',
					name: 'migrations',
					message: 'Add database migrations? (migrations/001_init.sql)',
					initial: false,
					active: 'yes',
					inactive: 'no'
				},
				{
					type: 'toggle',
					name: 'i18n',
					message: 'Add i18n translations? (locales/)',
					initial: true,
					active: 'yes',
					inactive: 'no'
				}
			],
			{
				onCancel: () => {
					throw new Error('cancelled');
				}
			}
		);
		blankSidebar = blankAnswers.sidebar ?? false;
		blankRemote = blankAnswers.remote ?? false;
		blankI18n = blankAnswers.i18n ?? true;
		blankMigrations = blankAnswers.migrations ?? false;

		// Ha migrations kell, a database permission automatikusan bekerül
		if (blankMigrations && !answers.permissions?.includes('database')) {
			answers.permissions = [...(answers.permissions ?? []), 'database'];
		}
	}

	return {
		pluginId: initialName ?? answers.pluginId,
		displayName: answers.displayName || toTitleCase(initialName ?? answers.pluginId ?? ''),
		description: answers.description || '',
		author: answers.author || '',
		template: selectedTemplate,
		permissions: answers.permissions ?? ['database', 'remote_functions'],
		install: options?.install !== false,
		blankSidebar,
		blankRemote,
		blankI18n,
		blankMigrations
	};
}
