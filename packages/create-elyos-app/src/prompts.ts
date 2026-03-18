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

	return {
		pluginId: initialName ?? answers.pluginId,
		displayName: answers.displayName || toTitleCase(initialName ?? answers.pluginId ?? ''),
		description: answers.description || '',
		author: answers.author || '',
		template: (options?.template ?? answers.template ?? 'basic') as PluginConfig['template'],
		permissions: answers.permissions ?? ['database', 'remote_functions'],
		install: options?.install !== false
	};
}
