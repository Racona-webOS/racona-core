<svelte:options customElement="__PLUGIN_ID__-plugin" />

<script lang="ts">
	/**
	 * Plugin Standalone Shell
	 *
	 * Generikus standalone nézet layout módú pluginokhoz.
	 * Automatikusan beolvassa a menu.json-t, a locale fájlokat és a komponenseket.
	 * Nyelvváltás támogatással.
	 */

	import menuData from '../menu.json';

	let { pluginId = '__PLUGIN_ID__' }: { pluginId?: string } = $props();

	// --- Komponensek ---
	const componentModules = import.meta.glob<{ default: any }>(
		'./components/*.svelte',
		{ eager: true }
	);

	function buildComponentMap() {
		const map: Record<string, any> = {};
		for (const [path, mod] of Object.entries(componentModules)) {
			const name = path.replace('./components/', '').replace('.svelte', '');
			map[name] = mod.default;
		}
		return map;
	}

	const componentMap = buildComponentMap();

	// --- Locale-ok (sidebar navigáció felirataihoz) ---
	const localeModules = import.meta.glob<Record<string, string>>(
		'../locales/*.json',
		{ eager: true, import: 'default' }
	);

	const availableLocales = Object.keys(localeModules).map((path) =>
		path.replace('../locales/', '').replace('.json', '')
	);

	function getLocaleData(locale: string): Record<string, string> {
		return localeModules[`../locales/${locale}.json`] ?? {};
	}

	let currentLocale = $state(availableLocales.includes('hu') ? 'hu' : availableLocales[0] ?? 'en');
	let translations = $derived(getLocaleData(currentLocale));

	// Locale váltás — szinkron módon frissíti a MockSDK-t is
	function switchLocale(locale: string) {
		const sdk = (window as any).webOS;
		if (sdk?.i18n?.setLocale) {
			sdk.i18n.setLocale(locale);
		}
		currentLocale = locale;
	}

	// --- Menü ---
	interface StandaloneMenuItem {
		id: string;
		componentName: string;
	}

	function resolveLabel(labelKey: string): string {
		if (!labelKey) return '';
		return translations[labelKey] ?? labelKey.split('.').pop() ?? labelKey;
	}

	const menuItems: StandaloneMenuItem[] = (menuData as any[])
		.filter((item: any) => item.component)
		.map((item: any) => ({
			id: item.href?.replace('#', '') ?? item.component,
			componentName: item.component
		}));

	let menuLabels = $derived(
		Object.fromEntries(
			(menuData as any[])
				.filter((item: any) => item.component)
				.map((item: any) => [
					item.href?.replace('#', '') ?? item.component,
					resolveLabel(item.labelKey ?? '')
				])
		)
	);

	let activeId = $state(menuItems[0]?.id ?? '');
	let activeItem = $derived(menuItems.find((m) => m.id === activeId) ?? menuItems[0]);
	let ActiveComponent = $derived(activeItem ? componentMap[activeItem.componentName] : null);
</script>

<div class="standalone-layout">
	<aside class="sidebar">
		<div class="sidebar-header">
			<span class="title">{pluginId}</span>
			<span class="badge">standalone</span>
		</div>
		<nav>
			{#each menuItems as item (item.id)}
				<button
					class="menu-item"
					class:active={activeId === item.id}
					onclick={() => (activeId = item.id)}
				>
					{menuLabels[item.id] ?? item.id}
				</button>
			{/each}
		</nav>
		{#if availableLocales.length > 1}
			<div class="locale-switcher">
				{#each availableLocales as locale (locale)}
					<button
						class="locale-btn"
						class:active={currentLocale === locale}
						onclick={() => switchLocale(locale)}
					>
						{locale.toUpperCase()}
					</button>
				{/each}
			</div>
		{/if}
	</aside>
	<main class="content">
		{#if ActiveComponent}
			{#key `${activeId}-${currentLocale}`}
				<ActiveComponent {pluginId} />
			{/key}
		{:else}
			<div class="no-component">
				<p>Komponens nem található: {activeItem?.componentName}</p>
			</div>
		{/if}
	</main>
</div>

<style>
	.standalone-layout {
		display: flex;
		height: 100vh;
		font-family: system-ui, -apple-system, sans-serif;
	}
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-right: 1px solid #e2e8f0;
		background: #f8fafc;
		padding: 1rem;
		width: 220px;
		flex-shrink: 0;
	}
	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 0.5rem;
	}
	.title { font-weight: 600; font-size: 0.9rem; }
	.badge {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		font-size: 0.6rem;
		font-weight: 600;
		margin-left: auto;
	}
	nav { display: flex; flex-direction: column; gap: 0.125rem; }
	.menu-item {
		border: none;
		background: transparent;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #475569;
		width: 100%;
		text-align: left;
		transition: all 0.15s ease;
	}
	.menu-item:hover { background: #e2e8f0; color: #1e293b; }
	.menu-item.active { background: #e0e7ff; color: #3730a3; font-weight: 600; }
	.content { flex: 1; overflow-y: auto; }
	.no-component {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #94a3b8;
	}
	.locale-switcher {
		margin-top: auto;
		display: flex;
		gap: 0.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e2e8f0;
	}
	.locale-btn {
		border: 1px solid #e2e8f0;
		background: transparent;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		color: #64748b;
		transition: all 0.15s ease;
	}
	.locale-btn:hover { background: #f1f5f9; color: #334155; }
	.locale-btn.active {
		background: #e0e7ff;
		color: #3730a3;
		border-color: #c7d2fe;
		font-weight: 600;
	}
</style>
