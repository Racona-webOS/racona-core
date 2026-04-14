/**
 * CLI type definitions
 */

export type PluginFeature =
	| 'sidebar'
	| 'database'
	| 'remote_functions'
	| 'datatable'
	| 'notifications'
	| 'i18n';

export interface PluginConfig {
	pluginId: string;
	displayName: string;
	description: string;
	author: string;
	features: PluginFeature[];
	install: boolean;
}

export interface PluginManifest {
	id: string;
	name: { hu: string; en: string };
	description: { hu: string; en: string };
	version: string;
	author: string;
	entry: string;
	icon: string;
	iconStyle: string;
	category: string;
	permissions: string[];
	multiInstance: boolean;
	defaultSize: { width: number; height: number };
	minSize: { width: number; height: number };
	maxSize: { width: number; height: number };
	keywords: string[];
	isPublic: boolean;
	sortOrder: number;
	dependencies: Record<string, string>;
	minWebOSVersion: string;
	locales: string[];
}
