/**
 * Interactive prompts for app scaffolding.
 */

import prompts from 'prompts';
import type { PluginConfig, PluginFeature } from './types.js';
import { normalizeFeatures } from './generator.js';

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
	options?: { features?: PluginFeature[]; install?: boolean }
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
			message: 'Description:',
			initial: 'An ElyOS application'
		},
		{
			type: 'text',
			name: 'author',
			message: 'Author (Name <email>):',
			initial: 'ElyOS Developer <dev@example.com>'
		}
	);

	// Feature multiselect — skip if features already provided via CLI flag
	if (!options?.features) {
		questions.push({
			type: 'multiselect',
			name: 'features',
			message: 'Features:',
			choices: [
				{
					title: 'Sidebar',
					value: 'sidebar',
					selected: false,
					description: 'Sidebar menu navigation'
				},
				{
					title: 'Database',
					value: 'database',
					selected: false,
					description: 'PostgreSQL database with migrations'
				},
				{
					title: 'Remote Functions',
					value: 'remote_functions',
					selected: false,
					description: 'Server-side functions'
				},
				{
					title: 'DataTable',
					value: 'datatable',
					selected: false,
					description: 'CRUD data table component'
				},
				{
					title: 'Notifications',
					value: 'notifications',
					selected: false,
					description: 'System notification support'
				},
				{
					title: 'i18n',
					value: 'i18n',
					selected: true,
					description: 'Internationalization'
				}
			]
		});
	}

	const answers = await prompts(questions, {
		onCancel: () => {
			throw new Error('cancelled');
		}
	});

	const selectedFeatures: PluginFeature[] = normalizeFeatures(
		options?.features ?? (answers.features as PluginFeature[]) ?? []
	);

	return {
		pluginId: initialName ?? answers.pluginId,
		displayName: answers.displayName || toTitleCase(initialName ?? answers.pluginId ?? ''),
		description: answers.description || 'An ElyOS application',
		author: answers.author || 'ElyOS Developer <dev@example.com>',
		features: selectedFeatures,
		install: options?.install !== false
	};
}
