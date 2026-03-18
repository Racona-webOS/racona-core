/**
 * Interaktív kérdések a plugin létrehozásához.
 */

import prompts from 'prompts';
import type { PluginConfig } from './types.js';

function validatePluginId(value: string): boolean | string {
	if (!value) return 'Plugin ID megadása kötelező';
	if (!/^[a-z][a-z0-9-]*$/.test(value)) {
		return 'Csak kisbetűk, számok és kötőjel (kebab-case)';
	}
	if (value.length < 2) return 'Minimum 2 karakter';
	if (value.length > 50) return 'Maximum 50 karakter';
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
			message: 'Plugin ID (kebab-case):',
			validate: validatePluginId
		});
	} else {
		const valid = validatePluginId(initialName);
		if (valid !== true) {
			throw new Error(valid as string);
		}
	}

	questions.push(
		{
			type: 'text',
			name: 'displayName',
			message: 'Megjelenítési név:',
			initial: toTitleCase(initialName ?? '')
		},
		{
			type: 'text',
			name: 'description',
			message: 'Leírás:'
		},
		{
			type: 'text',
			name: 'author',
			message: 'Szerző (Név <email>):'
		}
	);

	if (!options?.template) {
		questions.push({
			type: 'select',
			name: 'template',
			message: 'Template:',
			choices: [
				{ title: 'Basic', value: 'basic', description: 'Egyszerű plugin UI-val' },
				{ title: 'Advanced', value: 'advanced', description: 'Szerver függvényekkel' },
				{ title: 'Sidebar', value: 'sidebar', description: 'Sidebar menüvel (layout mód)' },
				{ title: 'DataTable', value: 'datatable', description: 'CRUD DataTable-lel' }
			],
			initial: 0
		});
	}

	questions.push({
		type: 'multiselect',
		name: 'permissions',
		message: 'Jogosultságok:',
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
