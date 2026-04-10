<!--
  Plugin Layout Wrapper

  Ez a komponens wrapper az AppLayout körül plugin esetén.
  Létrehozza a shell-t a megfelelő kontextusban.
-->
<script lang="ts">
	import { createAppShell } from '$lib/apps/appShell.svelte';
	import AppLayout from './AppLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { RawMenuItem } from '$lib/types/menu';
	import type { ActionBarItem } from '@elyos-dev/sdk';

	interface Props {
		pluginId: string;
		menuData: RawMenuItem[];
		maxWidthClass?: string;
	}

	let { pluginId, menuData, maxWidthClass = 'max-w-4xl' }: Props = $props();

	const shell = createAppShell({
		appName: pluginId,
		menuData: menuData,
		isPlugin: true
	});

	const pluginNamespace = `plugin:${pluginId}`;

	// SDK navigateTo handler regisztrálása
	const sdk = (window as any).__webOS_instances?.get(pluginId);
	if (sdk?.ui?._setNavigateToHandler) {
		sdk.ui._setNavigateToHandler((component: string, props?: Record<string, unknown>) => {
			shell.navigateTo(component, props);
		});
	}

	// SDK actionBar handler regisztrálása
	let actionBarItems = $state<ActionBarItem[]>([]);

	if (sdk?.ui?._setActionBarHandler) {
		sdk.ui._setActionBarHandler(
			(items: ActionBarItem[]) => {
				actionBarItems = items;
			},
			() => {
				actionBarItems = [];
			}
		);
	}

	// ActionBar törlése komponens váltáskor
	let lastComponent = $state<string | null>(null);
	$effect(() => {
		const current = shell.activeComponent;
		if (current !== lastComponent) {
			lastComponent = current;
			actionBarItems = [];
		}
	});
</script>

{#snippet pluginActionBar()}
	{#each actionBarItems as item (item.label)}
		<Button
			variant={item.variant ?? 'default'}
			size="sm"
			onclick={item.onClick}
			disabled={item.disabled}
		>
			{item.label}
		</Button>
	{/each}
{/snippet}

<AppLayout
	{shell}
	namespaces={[pluginNamespace]}
	isPlugin={true}
	searchable={true}
	{maxWidthClass}
	externalActionBar={actionBarItems.length > 0 ? pluginActionBar : undefined}
/>
