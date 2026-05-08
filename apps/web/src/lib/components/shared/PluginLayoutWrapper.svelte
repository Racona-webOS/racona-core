<!--
  Plugin Layout Wrapper

  Ez a komponens wrapper az AppLayout körül plugin esetén.
  Létrehozza a shell-t a megfelelő kontextusban.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { createAppShell } from '$lib/apps/appShell.svelte';
	import AppLayout from './AppLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { RawMenuItem } from '$lib/types/menu';
	import type { ActionBarItem } from '@racona/sdk';
	import {
		setPluginCapabilities,
		clearPluginCapabilities
	} from '$lib/stores/pluginCapabilitiesStore.svelte';

	interface Props {
		pluginId: string;
		menuData: RawMenuItem[];
		maxWidthClass?: string;
		sidebarWidth?: number | 'auto';
		sidebarComponent?: string | null; // Sidebar komponens neve (opcionális)
	}

	let {
		pluginId,
		menuData,
		maxWidthClass = 'max-w-4xl',
		sidebarWidth = 230,
		sidebarComponent
	}: Props = $props();

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

	// Sidebar component betöltése
	let sidebarComponentContainer = $state<HTMLDivElement | null>(null);
	let sidebarComponentLoaded = $state(false);

	// Plugin-capabilities esemény figyelése: a plugin maga publikálja, a store
	// pedig a $derived menü-számítást frissíti. Külön $effect, hogy a teardown
	// tiszta legyen (az async onMount nem adhat vissza cleanup callback-et).
	//
	// Figyelem: a cleanup NEM ürítit a core pluginCapabilitiesStore-ban tárolt
	// capability halmazt. A plugin singleton store-jai (pl. OrganizationStore)
	// a window-on élnek tovább az ablak bezárása után is, és újranyitáskor
	// nem futnak újra loadOrganizations → refreshCapabilities láncot, ezért
	// ha a cache-t itt törölnénk, a menü üres cap-pel renderelődne. A stale
	// érték nem probléma: szerver-szinkron után a publish event úgyis
	// felülírja.
	$effect(() => {
		const targetPluginId = pluginId;
		const handleCaps = (event: Event) => {
			const ce = event as CustomEvent<{ pluginId: string; capabilities?: string[] }>;
			if (!ce.detail || ce.detail.pluginId !== targetPluginId) return;
			setPluginCapabilities(targetPluginId, ce.detail.capabilities ?? []);
		};
		window.addEventListener('plugin-capabilities-changed', handleCaps);
		return () => {
			window.removeEventListener('plugin-capabilities-changed', handleCaps);
		};
	});

	onMount(async () => {
		// Ha van sidebarComponent prop, használjuk azt
		if (sidebarComponent) {
			await loadSidebarComponent(sidebarComponent);
		}
	});

	async function loadSidebarComponent(sidebarComponentName: string) {
		try {
			console.log(`[PluginLayoutWrapper] Loading sidebar component: ${sidebarComponentName}`);

			// Komponens betöltése az API-n keresztül
			const response = await fetch(`/api/plugins/${pluginId}/components/${sidebarComponentName}`);

			if (!response.ok) {
				console.warn(
					`[PluginLayoutWrapper] Failed to load component from API: ${response.statusText}`
				);
				return;
			}

			const code = await response.text();
			console.log(`[PluginLayoutWrapper] Component code received, length: ${code.length}`);

			// Komponens kód futtatása - csak ha még nincs regisztrálva a custom element
			const tagName = `racona-work-${sidebarComponentName.toLowerCase()}`;
			if (!customElements.get(tagName)) {
				const script = document.createElement('script');
				script.textContent = code;
				document.head.appendChild(script);
			} else {
				console.log(
					`[PluginLayoutWrapper] Custom element already registered: ${tagName}, skipping script`
				);
			}

			// Jelezzük, hogy betöltődött
			sidebarComponentLoaded = true;

			// Várunk egy tick-et, hogy a DOM frissüljön
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Custom element létrehozása és hozzáadása a containerhez
			if (sidebarComponentContainer) {
				const element = document.createElement(tagName);
				element.setAttribute('pluginId', pluginId);
				sidebarComponentContainer.appendChild(element);
				console.log(`[PluginLayoutWrapper] Sidebar component mounted successfully`);
			}
		} catch (error) {
			console.error(`[PluginLayoutWrapper] Error loading sidebar component:`, error);
		}
	}
</script>

{#snippet pluginActionBar()}
	{#each actionBarItems as item (item.label)}
		<Button
			variant={item.variant ?? 'default'}
			size={item.size ?? 'sm'}
			onclick={item.onClick}
			disabled={item.disabled}
		>
			{item.label}
		</Button>
	{/each}
{/snippet}

{#snippet sidebarFooter()}
	{#if sidebarComponentLoaded}
		<div class="plugin-sidebar-component" bind:this={sidebarComponentContainer}></div>
	{/if}
{/snippet}

<AppLayout
	{shell}
	namespaces={[pluginNamespace]}
	isPlugin={true}
	searchable={true}
	{maxWidthClass}
	{sidebarWidth}
	externalActionBar={actionBarItems.length > 0 ? pluginActionBar : undefined}
	customFooter={sidebarComponentLoaded ? sidebarFooter : undefined}
/>
