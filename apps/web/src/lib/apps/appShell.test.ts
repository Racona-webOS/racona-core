/**
 * Property-Based Tests for AppShell navigateTo
 *
 * Feature: list-detail-navigation, Property 1: navigateTo állapotfrissítés
 *
 * _Bármely_ komponens név és _bármely_ props objektum esetén, ha a `navigateTo`
 * függvényt meghívjuk ezekkel a paraméterekkel, akkor az AppShell `activeComponent`
 * értéke a megadott komponens névre, a `componentProps` értéke pedig a megadott
 * props-ra (az extraProps-szal összefésülve) kell változzon.
 *
 * **Validates: Requirements 1.1**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies before importing the module under test
vi.mock('$lib/services/client/appContext', () => ({
	getAppContext: () => ({ parameters: {}, windowId: 'test-window' })
}));

vi.mock('$lib/i18n/store.svelte', () => ({
	getTranslationStore: () => ({
		currentLocale: 'hu'
	})
}));

vi.mock('$lib/apps/localization', () => ({
	localizeMenuItems: (_ns: string, items: unknown[]) =>
		items.map((item: unknown) => {
			const i = item as Record<string, unknown>;
			return {
				label: i.label || '',
				href: i.href,
				component: i.component,
				props: i.props
			};
		})
}));

vi.mock('svelte', async () => {
	const actual = await vi.importActual('svelte');
	return {
		...actual,
		getContext: () => ({ parameters: {}, windowId: 'test-window' })
	};
});

import { createAppShell } from './appShell.svelte';

const testConfig = { numRuns: 100 };

// Arbitrary for component names (non-empty alphanumeric strings)
const componentNameArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{0,29}$/).filter((s) => s.length > 0);

// Arbitrary for props values (simple JSON-safe values)
const propsValueArb = fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null));

// Arbitrary for props objects
const propsArb = fc.dictionary(
	fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,9}$/).filter((s) => s.length > 0),
	propsValueArb,
	{ minKeys: 0, maxKeys: 5 }
);

describe('AppShell - Property 1: navigateTo állapotfrissítés', () => {
	/**
	 * Property 1a: navigateTo updates activeComponent
	 *
	 * For ANY valid component name, calling navigateTo should set
	 * activeComponent to that name.
	 *
	 * **Validates: Requirements 1.1**
	 */
	it('should update activeComponent to the given component name', () => {
		fc.assert(
			fc.property(componentNameArb, (componentName) => {
				const shell = createAppShell({
					appName: 'test',
					menuData: []
				});

				shell.navigateTo(componentName);

				expect(shell.activeComponent).toBe(componentName);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1b: navigateTo updates componentProps with given props
	 *
	 * For ANY valid component name and props object, calling navigateTo
	 * should set componentProps to contain all given props.
	 *
	 * **Validates: Requirements 1.1**
	 */
	it('should update componentProps to contain the given props', () => {
		fc.assert(
			fc.property(componentNameArb, propsArb, (componentName, props) => {
				const shell = createAppShell({
					appName: 'test',
					menuData: []
				});

				shell.navigateTo(componentName, props);

				// All provided props should be present in componentProps
				for (const [key, value] of Object.entries(props)) {
					expect(shell.componentProps[key]).toEqual(value);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1c: navigateTo merges extraProps with given props
	 *
	 * When extraProps callback is provided, navigateTo should merge
	 * extraProps into componentProps alongside the given props.
	 *
	 * **Validates: Requirements 1.1**
	 */
	it('should merge extraProps with given props', () => {
		fc.assert(
			fc.property(componentNameArb, propsArb, (componentName, props) => {
				const extraData = { extra: 'value', count: 42 };
				const shell = createAppShell({
					appName: 'test',
					menuData: [],
					extraProps: () => extraData
				});

				shell.navigateTo(componentName, props);

				// extraProps should be merged (extraProps overrides props per implementation)
				expect(shell.componentProps.extra).toBe('value');
				expect(shell.componentProps.count).toBe(42);

				// Props that don't conflict with extraProps should also be present
				for (const [key, value] of Object.entries(props)) {
					if (!(key in extraData)) {
						expect(shell.componentProps[key]).toEqual(value);
					}
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1d: navigateTo without props sets componentProps to extraProps only
	 *
	 * When navigateTo is called without props, componentProps should
	 * contain only the extraProps values (or empty object if no extraProps).
	 *
	 * **Validates: Requirements 1.1**
	 */
	it('should set componentProps to extraProps when called without props', () => {
		fc.assert(
			fc.property(componentNameArb, (componentName) => {
				const extraData = { data: 'test' };
				const shell = createAppShell({
					appName: 'test',
					menuData: [],
					extraProps: () => extraData
				});

				shell.navigateTo(componentName);

				expect(shell.componentProps).toEqual({ data: 'test' });

				return true;
			}),
			testConfig
		);
	});
});
