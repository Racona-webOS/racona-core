<!--
  AppLayout - Sidebar-os app layout komponens.

  Tartalmazza a teljes sidebar + content area struktúrát,
  beleértve az I18nProvider-t, AppSideBar-t, AppSideBarMenu-t és AppContentArea-t.
  Az app csak a konfigurációt adja át.

  @example
  ```svelte
  <AppLayout appName="settings" {shell} namespaces={['settings']} />
  ```
-->
<script lang="ts">
	import { setContext } from 'svelte';
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { type AppShellReturn, APP_SHELL_CONTEXT_KEY } from '$lib/apps/appShell.svelte';
	import { createActionBar } from '$lib/apps/actionBar.svelte';
	import { I18nProvider } from '$lib/i18n/components';
	import AppSideBar from './AppSideBar.svelte';
	import AppSideBarMenu from './AppSideBarMenu.svelte';
	import AppContentArea from './AppContentArea.svelte';

	interface Props {
		/** A createAppShell által visszaadott reaktív objektum. */
		shell: AppShellReturn;
		/** Az i18n namespace-ek listája (a 'common' automatikusan benne van). */
		namespaces?: string[];
		/** Maximális szélesség CSS osztály a tartalomhoz. */
		maxWidthClass?: string;
		/** Sidebar szélessége pixelben vagy 'auto' (alapértelmezett: 250). */
		sidebarWidth?: number | 'auto';
		/** Keresés engedélyezése a menüben. */
		searchable?: boolean;
		/** Plugin mód - komponensek API-n keresztül töltődnek. */
		isPlugin?: boolean;
		/** Külső action bar snippet (plugin módban használatos). */
		externalActionBar?: Snippet;
	}

	let {
		shell,
		namespaces = [],
		maxWidthClass = 'max-w-3xl',
		sidebarWidth = 230,
		searchable = false,
		isPlugin = false,
		externalActionBar
	}: Props = $props();

	// Shell context beállítása, hogy a dinamikusan betöltött komponensek is elérhessék
	setContext(APP_SHELL_CONTEXT_KEY, shell);

	// Action bar context létrehozása
	const actionBar = createActionBar();

	// Action bar automatikus törlése komponens váltáskor
	// Track the last component to avoid infinite loops
	let lastActiveComponent = $state<string | null>(null);
	$effect(() => {
		const currentComponent = shell.activeComponent;
		console.log(
			'[AppLayout] Active component changed:',
			currentComponent,
			'last:',
			lastActiveComponent
		);
		if (currentComponent !== lastActiveComponent) {
			lastActiveComponent = currentComponent;
			untrack(() => actionBar.clear());
		}
	});

	// A 'common' namespace mindig benne van.
	const allNamespaces = $derived(
		namespaces.includes('common') ? namespaces : ['common', ...namespaces]
	);
</script>

<I18nProvider namespaces={allNamespaces}>
	<div class="app-layout">
		<AppSideBar appName={shell.appName} width={sidebarWidth}>
			<AppSideBarMenu
				items={shell.menuItems}
				activeHref={shell.activeMenuItem ?? undefined}
				onItemClick={shell.handleMenuItemClick}
				initialExpandedParents={shell.expandedParents}
				{searchable}
			/>
		</AppSideBar>
		<div class="app-layout-right">
			<div class="app-layout-content-wrapper custom-scrollbar">
				<div class="app-layout-content {maxWidthClass}">
					<AppContentArea
						appName={shell.appName}
						component={shell.activeComponent}
						props={shell.componentProps}
						{isPlugin}
					/>
				</div>
			</div>
			{#if actionBar.content || externalActionBar}
				<div class="app-action-bar">
					{#if actionBar.content}
						{@render actionBar.content()}
					{:else if externalActionBar}
						{@render externalActionBar()}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</I18nProvider>

<style>
	.app-layout {
		display: flex;
		flex-direction: row;
		height: 100%;
		overflow: hidden;
	}

	.app-layout-right {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
		overflow: hidden;
	}

	.app-layout-content-wrapper {
		flex: 1;
		padding: 0 1.5rem 1rem 0.5rem;
		overflow-y: auto;
	}

	.app-layout-content :global {
		section {
			margin-bottom: 1.5rem;
			border-bottom: 1px solid var(--color-neutral-400);
			padding-bottom: 1.5rem;

			&:last-child {
				margin-bottom: 0;
				border-bottom: none;
				padding-bottom: 0;
			}
		}

		h2 {
			margin-bottom: 2rem;
			color: var(--color-neutral-900);
			font-weight: 600;
			font-size: 1.5rem;
			letter-spacing: -0.025em;
		}
	}

	:global(.dark) .app-layout-content :global {
		section {
			border-bottom-color: var(--color-neutral-700);
		}

		h2 {
			color: var(--color-neutral-300);
		}
	}

	:global {
		.app-layout-content {
			.title-block {
				margin-bottom: 2rem;
				h2 {
					margin-bottom: 0;
				}
				h3 {
					color: var(--color-neutral-500);
					font-size: 90%;
				}
			}
		}
	}

	.app-action-bar {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
		/*margin: 0 1.5rem 0.5rem 0.5rem;*/
		border-radius: var(--radius-md);
		/*background: linear-gradient(
			to bottom right,
			var(--color-neutral-200),
			var(--color-neutral-100)
		);*/
		background: var(--color-neutral-100);
		padding: 0.625rem 1rem;
	}

	:global(.dark) .app-action-bar {
		/*background: linear-gradient(
			to bottom right,
			var(--color-neutral-900),
			var(--color-neutral-800)
		);*/
		background: var(--color-neutral-800);
	}

	/* Global action bar styles for all apps */
	:global(.app-action-bar) {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
		border-radius: var(--radius-md);
		background: var(--color-neutral-100);
		padding: 0.625rem 1rem;
	}

	:global(.dark .app-action-bar) {
		background: var(--color-neutral-800);
	}
</style>
