/**
 * Project generator
 *
 * Feature-alapú projekt generálás. Egyetlen generateProject() kódút,
 * hasFeature() ellenőrzéseken alapuló fájlgenerálással.
 */

import {
	existsSync,
	mkdirSync,
	cpSync,
	writeFileSync,
	readdirSync,
	readFileSync,
	statSync
} from 'node:fs';
import { copyFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import type { PluginConfig, PluginFeature, PluginManifest } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Pure helper függvények
// ---------------------------------------------------------------------------

/**
 * Meghatározza, hogy a konfiguráció tartalmaz-e egy adott feature-t.
 * Pure függvény — mellékhatás nélkül, property-based tesztelhető.
 */
export function hasFeature(config: PluginConfig, feature: PluginFeature): boolean {
	return config.features.includes(feature);
}

/**
 * Normalizálja a feature listát: érvényesíti a database → remote_functions kényszert.
 * Ha 'database' szerepel és 'remote_functions' nem, hozzáadja.
 * Pure függvény — mellékhatás nélkül, property-based tesztelhető.
 */
export function normalizeFeatures(features: PluginFeature[]): PluginFeature[] {
	if (!features.includes('remote_functions')) {
		return features.filter((f) => f !== 'database');
	}
	return [...features];
}

/**
 * Kiszámítja a szükséges jogosultságokat a feature lista alapján.
 * Pure függvény — mellékhatás nélkül, property-based tesztelhető.
 */
export function computePermissions(features: PluginFeature[]): string[] {
	const permissionMap: Partial<Record<PluginFeature, string>> = {
		database: 'database',
		remote_functions: 'remote_functions',
		notifications: 'notifications'
	};
	const result = new Set<string>();
	for (const feature of features) {
		const perm = permissionMap[feature];
		if (perm) result.add(perm);
	}
	return Array.from(result);
}

// ---------------------------------------------------------------------------
// Fő generátor
// ---------------------------------------------------------------------------

export async function generateProject(config: PluginConfig): Promise<void> {
	const targetDir = join(process.cwd(), config.pluginId);

	if (existsSync(targetDir)) {
		throw new Error(`Directory "${config.pluginId}" already exists`);
	}

	console.log(pc.dim(`  Creating project: ${config.pluginId}`));

	// 1. Könyvtárstruktúra
	mkdirSync(join(targetDir, 'src'), { recursive: true });
	mkdirSync(join(targetDir, 'assets'), { recursive: true });

	if (hasFeature(config, 'sidebar')) {
		mkdirSync(join(targetDir, 'src', 'components'), { recursive: true });
	}
	if (hasFeature(config, 'remote_functions')) {
		mkdirSync(join(targetDir, 'server'), { recursive: true });
	}
	if (hasFeature(config, 'i18n')) {
		mkdirSync(join(targetDir, 'locales'), { recursive: true });
	}
	if (hasFeature(config, 'database')) {
		mkdirSync(join(targetDir, 'migrations'), { recursive: true });
	}

	// 2. Statikus asset-ek másolása _shared/-ból
	const sharedDir = join(__dirname, '..', 'templates', '_shared');
	if (!existsSync(sharedDir)) {
		throw new Error(`_shared template not found: ${sharedDir}`);
	}

	for (const f of [
		'.gitignore',
		'svelte.config.js',
		'tsconfig.json',
		'vite.config.ts',
		'index.html',
		'build-package.js'
	]) {
		const src = join(sharedDir, f);
		if (existsSync(src)) copyFileSync(src, join(targetDir, f));
	}

	// assets/icon.svg
	const iconSrc = join(sharedDir, 'assets', 'icon.svg');
	if (existsSync(iconSrc)) {
		copyFileSync(iconSrc, join(targetDir, 'assets', 'icon.svg'));
	}

	// build-all.js (sidebar esetén programatikusan generálva)
	if (hasFeature(config, 'sidebar')) {
		writeFileSync(join(targetDir, 'build-all.js'), generateBuildAllJs(config));
	}

	// 3. Generált fájlok
	writeFileSync(join(targetDir, 'src', 'App.svelte'), generateAppSvelte(config));
	writeFileSync(join(targetDir, 'src', 'main.ts'), generateMainTs(config));
	writeFileSync(join(targetDir, 'src', 'plugin.ts'), generatePluginTs(config));

	if (hasFeature(config, 'sidebar')) {
		writeMenuJson(targetDir, config);
		writeFileSync(
			join(targetDir, 'src', 'components', 'Overview.svelte'),
			generateOverviewSvelte(config)
		);
		writeFileSync(
			join(targetDir, 'src', 'components', 'Settings.svelte'),
			generateSettingsSvelte(config)
		);
		if (hasFeature(config, 'datatable')) {
			writeFileSync(
				join(targetDir, 'src', 'components', 'Datatable.svelte'),
				generateDatatableSvelte(config)
			);
		}
		if (hasFeature(config, 'notifications')) {
			writeFileSync(
				join(targetDir, 'src', 'components', 'Notifications.svelte'),
				generateNotificationsSvelte(config)
			);
		}
		if (hasFeature(config, 'remote_functions')) {
			writeFileSync(
				join(targetDir, 'src', 'components', 'Remote.svelte'),
				generateRemoteSvelte(config)
			);
		}
	}

	if (hasFeature(config, 'remote_functions')) {
		writeFileSync(join(targetDir, 'server', 'functions.ts'), generateServerFunctions());
		writeFileSync(join(targetDir, 'dev-server.ts'), generateDevServerTs(config));
	}

	if (hasFeature(config, 'i18n')) {
		const hasSidebar = hasFeature(config, 'sidebar');
		const huTranslations: Record<string, string> = { title: config.displayName };
		const enTranslations: Record<string, string> = { title: config.displayName };
		if (hasSidebar) {
			huTranslations['app.name'] = config.displayName;
			huTranslations['menu.overview'] = 'Áttekintés';
			huTranslations['menu.settings'] = 'Beállítások';
			huTranslations['overview.title'] = 'Áttekintés';
			huTranslations['overview.description'] = 'A tartalom itt jelenik meg.';
			huTranslations['settings.title'] = 'Beállítások';
			huTranslations['settings.description'] = 'A beállítások itt jelennek meg.';
			enTranslations['app.name'] = config.displayName;
			enTranslations['menu.overview'] = 'Overview';
			enTranslations['menu.settings'] = 'Settings';
			enTranslations['overview.title'] = 'Overview';
			enTranslations['overview.description'] = 'Your content here.';
			enTranslations['settings.title'] = 'Settings';
			enTranslations['settings.description'] = 'Your settings here.';
		}
		if (hasFeature(config, 'datatable')) {
			if (hasSidebar) {
				huTranslations['menu.datatable'] = 'Adattábla';
				enTranslations['menu.datatable'] = 'Data Table';
			}
			huTranslations['datatable.title'] = 'Adattábla';
			enTranslations['datatable.title'] = 'Data Table';
			huTranslations['datatable.columns.id'] = 'ID';
			huTranslations['datatable.columns.name'] = 'Név';
			huTranslations['datatable.columns.value'] = 'Érték';
			enTranslations['datatable.columns.id'] = 'ID';
			enTranslations['datatable.columns.name'] = 'Name';
			enTranslations['datatable.columns.value'] = 'Value';
			if (hasFeature(config, 'database')) {
				huTranslations['datatable.form.title'] = 'Elem hozzáadása';
				huTranslations['datatable.form.name'] = 'Név';
				huTranslations['datatable.form.value'] = 'Érték';
				huTranslations['datatable.form.submit'] = 'Hozzáadás';
				huTranslations['datatable.form.saving'] = 'Mentés...';
				huTranslations['datatable.duplicate'] = 'Duplikálás';
				huTranslations['datatable.delete'] = 'Törlés';
				huTranslations['datatable.delete.title'] = 'Elem törlése';
				huTranslations['datatable.delete.message'] = 'Biztosan törli ezt az elemet:';
				huTranslations['datatable.delete.confirm'] = 'Törlés';
				huTranslations['datatable.success.itemAdded'] = 'Elem hozzáadva';
				huTranslations['datatable.success.itemDeleted'] = 'Elem törölve';
				huTranslations['datatable.success.itemDuplicated'] = 'Elem duplikálva';
				huTranslations['datatable.error.loadFailed'] = 'Betöltés sikertelen';
				huTranslations['datatable.error.insertFailed'] = 'Hozzáadás sikertelen';
				huTranslations['datatable.error.deleteFailed'] = 'Törlés sikertelen';
				huTranslations['datatable.error.duplicateFailed'] = 'Duplikálás sikertelen';
				enTranslations['datatable.form.title'] = 'Add item';
				enTranslations['datatable.form.name'] = 'Name';
				enTranslations['datatable.form.value'] = 'Value';
				enTranslations['datatable.form.submit'] = 'Add item';
				enTranslations['datatable.form.saving'] = 'Saving...';
				enTranslations['datatable.duplicate'] = 'Duplicate';
				enTranslations['datatable.delete'] = 'Delete';
				enTranslations['datatable.delete.title'] = 'Delete item';
				enTranslations['datatable.delete.message'] = 'Are you sure you want to delete';
				enTranslations['datatable.delete.confirm'] = 'Delete';
				enTranslations['datatable.success.itemAdded'] = 'Item added';
				enTranslations['datatable.success.itemDeleted'] = 'Item deleted';
				enTranslations['datatable.success.itemDuplicated'] = 'Item duplicated';
				enTranslations['datatable.error.loadFailed'] = 'Failed to load data';
				enTranslations['datatable.error.insertFailed'] = 'Failed to insert item';
				enTranslations['datatable.error.deleteFailed'] = 'Failed to delete item';
				enTranslations['datatable.error.duplicateFailed'] = 'Failed to duplicate item';
			}
		}
		if (hasFeature(config, 'notifications')) {
			if (hasSidebar) {
				huTranslations['menu.notifications'] = 'Értesítések';
				enTranslations['menu.notifications'] = 'Notifications';
			}
			huTranslations['notifications.title'] = 'Értesítések';
			huTranslations['notifications.send'] = 'Értesítés küldése';
			enTranslations['notifications.title'] = 'Notifications';
			enTranslations['notifications.send'] = 'Send notification';
		}
		if (hasFeature(config, 'remote_functions')) {
			if (hasSidebar) {
				huTranslations['menu.remote'] = 'Remote';
				enTranslations['menu.remote'] = 'Remote';
			}
			huTranslations['remote.title'] = 'Remote funkciók';
			huTranslations['remote.call'] = 'Szerver hívása';
			enTranslations['remote.title'] = 'Remote Functions';
			enTranslations['remote.call'] = 'Call server';
		}
		writeFileSync(
			join(targetDir, 'locales', 'hu.json'),
			JSON.stringify(huTranslations, null, '\t') + '\n'
		);
		writeFileSync(
			join(targetDir, 'locales', 'en.json'),
			JSON.stringify(enTranslations, null, '\t') + '\n'
		);
	}

	if (hasFeature(config, 'database')) {
		writeDatabaseFiles(targetDir, config);
	}

	writeManifest(targetDir, config);
	writePackageJson(targetDir, config);
	writeReadme(targetDir, config);

	// 4. Placeholder csere
	if (hasFeature(config, 'database') || hasFeature(config, 'sidebar')) {
		replaceTemplatePlaceholders(targetDir, config);
	}

	// 5. Függőségek telepítése
	if (config.install) {
		console.log(pc.dim('  Installing dependencies...'));
		try {
			execSync('bun install', { cwd: targetDir, stdio: 'pipe' });
		} catch {
			console.log(pc.yellow('  ⚠ bun install failed'));
			console.log(pc.dim('    Set the correct path in package.json:'));
			console.log(pc.dim('    "@elyos-dev/sdk": "^0.1.0"'));
			console.log(pc.dim('    Then run: bun install'));
		}
	}

	console.log();
	console.log(pc.green('  ✅ App created successfully!'));
	console.log();
	console.log(`  ${pc.bold('Next steps:')}`);
	console.log(`  ${pc.cyan(`cd ${config.pluginId}`)}`);
	console.log(`  ${pc.cyan('bun dev')}`);
	console.log();
}

// ---------------------------------------------------------------------------
// App.svelte generálás
// ---------------------------------------------------------------------------

/**
 * App.svelte tartalom generálása feature-kombináció alapján.
 * Prioritás: sidebar → datatable → notifications → remote_functions → alap
 */
function generateAppSvelte(config: PluginConfig): string {
	if (hasFeature(config, 'sidebar')) {
		return `<svelte:options customElement={{ tag: '__PLUGIN_ID__-plugin', shadow: 'none' }} />

<script lang="ts">
	/**
	 * Plugin Standalone Shell
	 *
	 * Generikus standalone nézet layout módú pluginokhoz.
	 * Automatikusan beolvassa a menu.json-t, a locale fájlokat és a komponenseket.
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

	// --- Locale-ok ---
	const localeModules = import.meta.glob<Record<string, string>>(
		'../locales/*.json',
		{ eager: true, import: 'default' }
	);

	const availableLocales = Object.keys(localeModules).map((path) =>
		path.replace('../locales/', '').replace('.json', '')
	);

	function getLocaleData(locale: string): Record<string, string> {
		return localeModules[\`../locales/\${locale}.json\`] ?? {};
	}

	let currentLocale = $state(availableLocales.includes('hu') ? 'hu' : availableLocales[0] ?? 'en');
	let translations = $derived(getLocaleData(currentLocale));

	function switchLocale(locale: string) {
		const sdk = (window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS;
		if (sdk?.i18n?.setLocale) sdk.i18n.setLocale(locale);
		currentLocale = locale;
	}

	// --- Menü ---
	function resolveLabel(labelKey: string): string {
		if (!labelKey) return '';
		return translations[labelKey] ?? labelKey.split('.').pop() ?? labelKey;
	}

	const menuItems = (menuData as any[])
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
					item.label ?? resolveLabel(item.labelKey ?? '')
				])
		)
	);

	let activeId = $state(menuItems[0]?.id ?? '');
	let activeItem = $derived(menuItems.find((m) => m.id === activeId) ?? menuItems[0]);
	let ActiveComponent = $derived(activeItem ? componentMap[activeItem.componentName] : null);
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-header">
			<span class="app-name">{translations['app.name'] ?? pluginId}</span>
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
			{#key \`\${activeId}-\${currentLocale}\`}
				<!-- svelte-ignore svelte_component_deprecated -->
				<svelte:component this={ActiveComponent} {pluginId} />
			{/key}
		{:else}
			<div class="no-component"><p>{translations['error.componentNotFound'] ?? 'Komponens nem található'}: {activeItem?.componentName}</p></div>
		{/if}
	</main>
</div>

<style>
	.layout {
		display: flex;
		height: 100vh;
		font-family: system-ui, -apple-system, sans-serif;
		background: var(--color-background, #ffffff);
		color: var(--color-foreground, #0f172a);
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		border-right: 1px solid var(--color-border, #e2e8f0);
		background: var(--color-sidebar, #f8fafc);
		padding: 1rem;
		width: 220px;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
		margin-bottom: 0.5rem;
	}

	.app-name {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--color-foreground, #0f172a);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
	}

	.menu-item {
		border: none;
		background: transparent;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-muted-foreground, #475569);
		width: 100%;
		text-align: left;
		transition: all 0.15s ease;
	}

	.menu-item:hover {
		background: var(--color-accent, #e2e8f0);
		color: var(--color-foreground, #1e293b);
	}

	.menu-item.active {
		background: var(--color-primary-subtle, #e0e7ff);
		color: var(--color-primary, #3730a3);
		font-weight: 600;
	}

	.content {
		flex: 1;
		overflow-y: auto;
	}

	.no-component {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: var(--color-muted-foreground, #94a3b8);
	}

	:global(.dark) .layout {
		background: var(--color-background, oklch(26.448% 0.00003 271.152));
		color: var(--color-foreground, oklch(0.985 0 0));
	}

	:global(.dark) .sidebar {
		background: var(--color-sidebar, oklch(0.205 0 0));
		border-color: var(--color-border, oklch(1 0 0 / 10%));
	}

	:global(.dark) .sidebar-header {
		border-color: var(--color-border, oklch(1 0 0 / 10%));
	}

	:global(.dark) .menu-item {
		color: var(--color-muted-foreground, oklch(0.708 0 0));
	}

	:global(.dark) .menu-item:hover {
		background: var(--color-accent, oklch(0.269 0 0));
		color: var(--color-foreground, oklch(0.985 0 0));
	}

	:global(.dark) .menu-item.active {
		background: var(--color-accent, oklch(0.25 0.03 var(--primary-h, 264)));
		color: var(--color-primary, oklch(0.66 0.12 264));
	}

	.locale-switcher {
		display: flex;
		gap: 0.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #e2e8f0);
	}

	.locale-btn {
		border: 1px solid var(--color-border, #e2e8f0);
		background: transparent;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-muted-foreground, #64748b);
		transition: all 0.15s ease;
	}

	.locale-btn:hover {
		background: var(--color-accent, #f1f5f9);
	}

	.locale-btn.active {
		background: var(--color-primary-subtle, #e0e7ff);
		color: var(--color-primary, #3730a3);
		border-color: var(--color-primary-border, #c7d2fe);
		font-weight: 600;
	}
</style>
`;
	}

	if (hasFeature(config, 'datatable')) {
		const titleExpr = hasFeature(config, 'i18n')
			? `{sdk?.i18n.t('title') ?? '${config.displayName}'}`
			: `${config.displayName}`;

		const datatableBlock = `
	{#if loading}
		<p>Loading...</p>
	{:else}
		<table>
			<thead>
				{#each table.getHeaderGroups() as headerGroup}
					<tr>{#each headerGroup.headers as header}<th>{header.column.columnDef.header as string}</th>{/each}</tr>
				{/each}
			</thead>
			<tbody>
				{#each table.getRowModel().rows as row}
					<tr>{#each row.getVisibleCells() as cell}<td>{cell.getValue() as string}</td>{/each}</tr>
				{/each}
			</tbody>
		</table>
		<button onclick={loadData}>Refresh</button>
	{/if}`;

		const notifBlock = hasFeature(config, 'notifications')
			? `
	<hr />
	<h2>Notifications</h2>
	<button onclick={sendNotification}>Send notification</button>`
			: '';

		const remoteBlock = hasFeature(config, 'remote_functions')
			? `
	<hr />
	<h2>Remote Functions</h2>
	<button onclick={callExample}>Call server</button>
	{#if remoteResult}<p class="result">{remoteResult}</p>{/if}`
			: '';

		const notifFn = hasFeature(config, 'notifications')
			? `
	async function sendNotification() {
		await sdk?.notifications?.send({ userId: sdk?.context?.user?.id ?? '', title: '${config.displayName}', message: 'Hello!', type: 'info' });
	}`
			: '';

		const remoteFn = hasFeature(config, 'remote_functions')
			? `
	let remoteResult = $state('');
	async function callExample() {
		const res = await sdk?.remote?.call<{ result: string }>('example');
		remoteResult = res?.result ?? 'No response';
	}`
			: '';

		return `<script lang="ts">
	import { onMount, createRawSnippet } from 'svelte';

	const sdk = (window as any).webOS;

	// SDK DataTable komponensek — csak telepített módban érhetők el
	const DataTable = $derived(sdk?.components?.DataTable);
	const DataTableColumnHeader = $derived(sdk?.components?.DataTableColumnHeader);
	const renderComponent = $derived(sdk?.components?.renderComponent);
	const renderSnippet = $derived(sdk?.components?.renderSnippet);

	interface Row { id: number; name: string; value: string; }
	let data = $state<Row[]>([]);
	let loading = $state(false);
	let paginationInfo = $state({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
	let tableState = $state({ page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'asc' as 'asc' | 'desc' });
	let columns = $state<any[]>([]);

	async function loadData() {
		loading = true;
		try {
			data = ${
				hasFeature(config, 'database')
					? `await sdk?.data?.query<Row>('SELECT id, name, value FROM items ORDER BY created_at DESC LIMIT 50') ?? []`
					: `await sdk?.data?.get<Row[]>('items') ?? []`
			};
			paginationInfo = { page: 1, pageSize: data.length, totalCount: data.length, totalPages: 1 };
		} catch { sdk?.ui?.toast('Failed to load data', 'error'); }
		finally { loading = false; }
	}

	function buildColumns() {
		if (!DataTableColumnHeader || !renderComponent || !renderSnippet) return;
		const handleSort = (id: string, desc: boolean) => {
			tableState = { ...tableState, sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 };
		};
		columns = ['id', 'name', 'value'].map((key) => ({
			accessorKey: key,
			meta: { title: key.charAt(0).toUpperCase() + key.slice(1) },
			header: ({ column }: any) => renderComponent(DataTableColumnHeader, {
				get column() { return column; },
				get title() { return key.charAt(0).toUpperCase() + key.slice(1); },
				onSort: handleSort
			}),
			cell: ({ row }: any) => {
				const val = String(row.original[key] ?? '—');
				return renderSnippet(createRawSnippet(() => ({ render: () => \`<span class="text-sm">\${val}</span>\` })), {});
			}
		}));
	}

	onMount(() => { buildColumns(); if (sdk?.data && DataTable) loadData(); });
${notifFn}${remoteFn}
</script>

<div class="plugin-container">
	<h1>${titleExpr}</h1>
	<h2>Data Table</h2>

	{#if DataTable && columns.length > 0}
		{#key data}
			<!-- svelte-ignore svelte_component_deprecated -->
			<svelte:component
				this={DataTable}
				{columns}
				{data}
				pagination={paginationInfo}
				{loading}
				onStateChange={(s: any) => (tableState = s)}
			/>
		{/key}
	{:else}
		<div class="dev-notice">
			<p class="dev-notice-title">⚠ Not available in standalone mode</p>
			<p>The DataTable component is only available when the plugin is installed in ElyOS (<code>sdk.components.DataTable</code>).</p>
			<p>Once installed, data will be loaded via the <code>sdk.data</code> service.</p>
		</div>
	{/if}${notifBlock}${remoteBlock}
</div>

<style>
	.plugin-container { padding: 2rem; font-family: system-ui, sans-serif; }
	.dev-notice { border: 1px solid #f59e0b; background: #fffbeb; border-radius: 0.5rem; padding: 1.25rem 1.5rem; color: #92400e; max-width: 520px; margin-bottom: 1rem; }
	.dev-notice-title { font-weight: 700; margin: 0 0 0.5rem; }
	.dev-notice p { margin: 0.25rem 0; font-size: 0.875rem; }
	.dev-notice code { background: #fef3c7; padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-size: 0.8rem; }
	hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
	button { cursor: pointer; border: 1px solid #ccc; border-radius: 0.25rem; padding: 0.5rem 1rem; margin-right: 0.5rem; }
	.result { margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.25rem; font-family: monospace; }
</style>
`;
	}

	if (hasFeature(config, 'notifications')) {
		const titleExpr = hasFeature(config, 'i18n')
			? `{sdk?.i18n.t('title') ?? '${config.displayName}'}`
			: `${config.displayName}`;

		const remoteBlock = hasFeature(config, 'remote_functions')
			? `
	<hr />
	<h2>Remote Functions</h2>
	<button onclick={callExample}>Call server</button>
	{#if remoteResult}<p class="result">{remoteResult}</p>{/if}`
			: '';

		const remoteFn = hasFeature(config, 'remote_functions')
			? `
	let remoteResult = $state('');
	async function callExample() {
		const res = await sdk?.remote?.call<{ result: string }>('example');
		remoteResult = res?.result ?? 'No response';
	}`
			: '';

		return `<script lang="ts">
	const sdk = (window as any).webOS;

	async function sendNotification() {
		await sdk?.notifications?.send({ userId: sdk?.context?.user?.id ?? '', title: '${config.displayName}', message: 'Hello from ${config.displayName}!', type: 'info' });
	}
${remoteFn}
</script>

<div class="plugin-container">
	<h1>${titleExpr}</h1>
	<h2>Notifications</h2>
	<button onclick={sendNotification}>Send notification</button>${remoteBlock}
</div>

<style>
	.plugin-container { padding: 2rem; font-family: system-ui, sans-serif; }
	hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
	button { cursor: pointer; border: 1px solid #ccc; border-radius: 0.25rem; padding: 0.5rem 1rem; margin-right: 0.5rem; }
	.result { margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.25rem; font-family: monospace; }
</style>
`;
	}

	if (hasFeature(config, 'remote_functions')) {
		const titleExpr = hasFeature(config, 'i18n')
			? `{sdk?.i18n.t('title') ?? '${config.displayName}'}`
			: `${config.displayName}`;
		return `<script lang="ts">
	const sdk = (window as any).webOS;

	let result = $state('');
	async function callExample() {
		const res = await sdk?.remote?.call<{ result: string }>('example');
		result = res?.result ?? 'No response';
	}
</script>

<div class="plugin-container">
	<h1>${titleExpr}</h1>
	<h2>Remote Functions</h2>
	<button onclick={callExample}>Call server</button>
	{#if result}<p class="result">{result}</p>{/if}
</div>

<style>
	.plugin-container { padding: 2rem; font-family: system-ui, sans-serif; }
	button { cursor: pointer; border: 1px solid #ccc; border-radius: 0.25rem; padding: 0.5rem 1rem; }
	.result { margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.25rem; font-family: monospace; }
</style>
`;
	}

	// Alap hello world
	const titleExpr = hasFeature(config, 'i18n')
		? `{sdk?.i18n.t('title') ?? '${config.displayName}'}`
		: `${config.displayName}`;
	const welcomeExpr = hasFeature(config, 'i18n')
		? `{sdk?.i18n.t('welcome') ?? 'Welcome!'}`
		: `Welcome!`;
	return `<script lang="ts">
	const sdk = window.webOS;
</script>

<div class="plugin-container">
	<h1>${titleExpr}</h1>
	<p>${welcomeExpr}</p>
</div>

<style>
	.plugin-container { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
}

// ---------------------------------------------------------------------------
// main.ts generálás
// ---------------------------------------------------------------------------

/**
 * main.ts tartalom generálása.
 * i18n only → locale betöltés + MockSDK i18n init
 * remote_functions only → remote handler felülírás
 * mindkettő → kombinált
 * egyik sem → minimális MockSDK init
 */
function generateMainTs(config: PluginConfig): string {
	const hasI18n = hasFeature(config, 'i18n');
	const hasRemote = hasFeature(config, 'remote_functions');
	// main.ts mindig src/ alatt van, a locales/ a projekt gyökerében → ../locales/
	const localeGlobPath = '../locales/*.json';
	const localePrefix = '../locales/';

	const localeBlock = hasI18n
		? `
\t\tconst localeModules = import.meta.glob<Record<string, string>>('${localeGlobPath}', {
\t\t\teager: true,
\t\t\timport: 'default'
\t\t});
\t\tconst translations: Record<string, Record<string, string>> = {};
\t\tfor (const [path, data] of Object.entries(localeModules)) {
\t\t\tconst locale = path.replace('${localePrefix}', '').replace('.json', '');
\t\t\ttranslations[locale] = data;
\t\t}
\t\tconst defaultLocale = 'hu' in translations ? 'hu' : (Object.keys(translations)[0] ?? 'en');
`
		: '';

	const sdkInitArgs = hasI18n ? '{ i18n: { locale: defaultLocale, translations } }' : '{}';

	const remoteBlock = hasRemote
		? `
\t\tconst DEV_SERVER_URL = 'http://localhost:5175';
\t\tif ((window as any).webOS?.remote) {
\t\t\t(window as any).webOS.remote.call = async (functionName: string, params: unknown) => {
\t\t\t\ttry {
\t\t\t\t\tconst response = await fetch(\`\${DEV_SERVER_URL}/api/remote/\${functionName}\`, {
\t\t\t\t\t\tmethod: 'POST',
\t\t\t\t\t\theaders: { 'Content-Type': 'application/json' },
\t\t\t\t\t\tbody: JSON.stringify({ params })
\t\t\t\t\t});
\t\t\t\t\tconst data = await response.json();
\t\t\t\t\tif (data.success) return data.result;
\t\t\t\t\tthrow new Error(data.error);
\t\t\t\t} catch (err: unknown) {
\t\t\t\t\tif (err instanceof Error && err.message && !err.message.startsWith('[DevMode]')) {
\t\t\t\t\t\tthrow new Error(\`[DevMode] Remote call failed: \${functionName} — \${err.message}\`);
\t\t\t\t\t}
\t\t\t\t\tthrow err;
\t\t\t\t}
\t\t\t};
\t\t}
`
		: '';

	return `import { mount } from 'svelte';
import App from './App.svelte';
import SimpleDataTable from '@elyos-dev/sdk/dev/components/SimpleDataTable.svelte';

async function initDevSDK() {
\tif (typeof window !== 'undefined' && !(window as any).webOS) {
\t\tconst { MockWebOSSDK } = await import('@elyos-dev/sdk/dev');
${localeBlock}
\t\tMockWebOSSDK.initialize(${sdkInitArgs}, { DataTable: SimpleDataTable });
${remoteBlock}\t}
}

async function init() {
\tawait initDevSDK();
\tconst target = document.getElementById('app');
\tif (target) mount(App, { target });
}

init();
export default App;
`;
}

// ---------------------------------------------------------------------------
// dev-server.ts generálás
// ---------------------------------------------------------------------------

/**
 * dev-server.ts tartalom generálása.
 * remote_functions only (no database) → statikus fájlszerver
 * database + remote_functions → DB-képes verzió
 */
function generateDevServerTs(config: PluginConfig): string {
	const hasDb = hasFeature(config, 'database');

	if (!hasDb) {
		return `/**
 * Dev szerver a plugin fejlesztéshez.
 * Statikus fájlokat szolgál ki a projekt gyökeréből és a dist/ mappából.
 *
 * Használat: bun dev-server.ts
 */

import { serve } from 'bun';
import { readFile } from 'fs/promises';
import { join, extname, resolve, normalize } from 'path';

const PORT = parseInt(process.env.PORT ?? '5175', 10);
const ROOT = import.meta.dir;

const MIME: Record<string, string> = {
\t'.js': 'application/javascript',
\t'.json': 'application/json',
\t'.svg': 'image/svg+xml',
\t'.png': 'image/png',
\t'.css': 'text/css',
\t'.html': 'text/html'
};

serve({
\tport: PORT,
\tasync fetch(req) {
\t\tconst url = new URL(req.url);
\t\tlet pathname = url.pathname === '/' ? '/index.html' : url.pathname;

\t\tconst corsHeaders = {
\t\t\t'Access-Control-Allow-Origin': '*',
\t\t\t'Access-Control-Allow-Methods': 'GET, OPTIONS',
\t\t\t'Access-Control-Allow-Headers': '*'
\t\t};

\t\tif (req.method === 'OPTIONS') {
\t\t\treturn new Response(null, { status: 204, headers: corsHeaders });
\t\t}

\t\tconst safePath = normalize(pathname).replace(/^(\\.\\.(\\\/|\\\\|$))+/, '');
\t\tconst searchPaths = [join(ROOT, 'dist', safePath), join(ROOT, safePath)];

\t\tfor (const filePath of searchPaths) {
\t\t\tconst resolvedPath = resolve(filePath);
\t\t\tif (!resolvedPath.startsWith(ROOT + '/') && resolvedPath !== ROOT) {
\t\t\t\treturn new Response('Forbidden', { status: 403, headers: corsHeaders });
\t\t\t}
\t\t\ttry {
\t\t\t\tconst content = await readFile(resolvedPath);
\t\t\t\tconst ext = extname(resolvedPath);
\t\t\t\treturn new Response(content, {
\t\t\t\t\theaders: { 'Content-Type': MIME[ext] ?? 'application/octet-stream', ...corsHeaders }
\t\t\t\t});
\t\t\t} catch {
\t\t\t\t// Nem található, próbáljuk a következőt
\t\t\t}
\t\t}

\t\treturn new Response('Not Found', { status: 404, headers: corsHeaders });
\t}
});

console.log(\`[DevServer] Plugin dev szerver fut: http://localhost:\${PORT}\`);
console.log('[DevServer] Futtasd párhuzamosan: bun run build --watch');
`;
	}

	// DB-képes verzió
	return `/**
 * Dev szerver a plugin fejlesztéshez.
 * Statikus fájlokat szolgál ki és POST /api/remote/:functionName endpointot biztosít
 * a server/functions.ts függvényeinek lokális adatbázison való futtatásához.
 *
 * Indítás előtt:
 *   1. cp .env.example .env
 *   2. bun db:up
 *   3. bun dev:server
 *
 * Használat: bun dev-server.ts
 */

import { serve } from 'bun';
import { readFile } from 'fs/promises';
import { join, extname, resolve, normalize } from 'path';
import { Pool } from 'pg';

const PORT = parseInt(process.env.PORT ?? '5175', 10);
const ROOT = import.meta.dir;
const PLUGIN_ID = '__PLUGIN_ID__';
const PLUGIN_SCHEMA = 'app____PLUGIN_ID_UNDERSCORE__';
const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user';

const MIME: Record<string, string> = {
\t'.js': 'application/javascript',
\t'.json': 'application/json',
\t'.svg': 'image/svg+xml',
\t'.png': 'image/png',
\t'.css': 'text/css',
\t'.html': 'text/html'
};

function createPool(databaseUrl: string): Pool {
\treturn new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
}

async function checkDbConnection(pool: Pool): Promise<void> {
\tconst timeout = new Promise<never>((_, reject) =>
\t\tsetTimeout(() => reject(new Error('Kapcsolat timeout (10s)')), 10000)
\t);
\ttry {
\t\tawait Promise.race([pool.query('SELECT 1'), timeout]);
\t\tconsole.log('[DevServer] Adatbázis kapcsolat OK');
\t} catch (err) {
\t\tconsole.error('[DevServer] HIBA: Nem sikerült csatlakozni az adatbázishoz. Ellenőrizd, hogy fut-e a Docker container (bun db:up).', err);
\t\tprocess.exit(1);
\t}
}

async function runMigrations(pool: Pool): Promise<void> {
\tconst client = await pool.connect();
\ttry {
\t\tawait client.query(\`CREATE SCHEMA IF NOT EXISTS \${PLUGIN_SCHEMA}\`);
\t\tawait client.query(\`SET search_path TO \${PLUGIN_SCHEMA}, auth, public\`);
\t\tawait client.query(\`
\t\t\tCREATE TABLE IF NOT EXISTS _migrations (
\t\t\t\tid SERIAL PRIMARY KEY,
\t\t\t\tfilename TEXT NOT NULL UNIQUE,
\t\t\t\tapplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
\t\t\t)
\t\t\`);

\t\tconst devMigrationsDir = join(ROOT, 'migrations', 'dev');
\t\tlet devFiles: string[] = [];
\t\ttry {
\t\t\tconst { readdirSync } = await import('fs');
\t\t\tdevFiles = readdirSync(devMigrationsDir).filter((f) => f.endsWith('.sql')).sort();
\t\t} catch { /* nincs dev mappa */ }

\t\tfor (const file of devFiles) {
\t\t\ttry {
\t\t\t\tconst sql = await readFile(join(devMigrationsDir, file), 'utf-8');
\t\t\t\tawait client.query(sql);
\t\t\t\tconsole.log(\`[DevServer] Dev migration futtatva: \${file}\`);
\t\t\t} catch (err) {
\t\t\t\tconsole.error(\`[DevServer] HIBA: Migráció sikertelen: \${file}\`, err);
\t\t\t\tprocess.exit(1);
\t\t\t}
\t\t}

\t\tconst migrationsDir = join(ROOT, 'migrations');
\t\tlet prodFiles: string[] = [];
\t\ttry {
\t\t\tconst { readdirSync } = await import('fs');
\t\t\tprodFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
\t\t} catch { /* nincs mappa */ }

\t\tconst { rows: applied } = await client.query<{ filename: string }>('SELECT filename FROM _migrations');
\t\tconst appliedSet = new Set(applied.map((r) => r.filename));

\t\tfor (const file of prodFiles) {
\t\t\tif (appliedSet.has(file)) { console.log(\`[DevServer] Migration kihagyva: \${file}\`); continue; }
\t\t\ttry {
\t\t\t\tconst sql = await readFile(join(migrationsDir, file), 'utf-8');
\t\t\t\tawait client.query(sql);
\t\t\t\tawait client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
\t\t\t\tconsole.log(\`[DevServer] Migration alkalmazva: \${file}\`);
\t\t\t} catch (err) {
\t\t\t\tconsole.error(\`[DevServer] HIBA: Migráció sikertelen: \${file}\`, err);
\t\t\t\tprocess.exit(1);
\t\t\t}
\t\t}
\t\tconsole.log('[DevServer] Migrációk alkalmazva.');
\t} finally {
\t\tclient.release();
\t}
}

interface RemoteContext {
\tpluginId: string;
\tuserId: string;
\tdb: {
\t\tquery: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
\t\tconnect: () => Promise<{ query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>; release: () => void }>;
\t};
\tpermissions: string[];
\temail: { send: (params: unknown) => Promise<{ success: boolean }> };
}

function buildContext(pool: Pool): RemoteContext {
\treturn {
\t\tpluginId: PLUGIN_ID,
\t\tuserId: DEV_USER_ID,
\t\tdb: {
\t\t\tquery: pool.query.bind(pool) as (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>,
\t\t\tconnect: async () => {
\t\t\t\tconst client = await pool.connect();
\t\t\t\treturn {
\t\t\t\t\tquery: client.query.bind(client) as (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>,
\t\t\t\t\trelease: () => client.release()
\t\t\t\t};
\t\t\t}
\t\t},
\t\tpermissions: ['database', 'remote_functions', 'notifications'],
\t\temail: {
\t\t\tsend: async (params: unknown) => { console.log('[DevServer] [email.send stub]', params); return { success: true }; }
\t\t}
\t};
}

async function handleRemoteRequest(req: Request, functionName: string, pool: Pool): Promise<Response> {
\tconst corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' };
\tlet params: unknown;
\ttry {
\t\tconst body = await req.json();
\t\tparams = (body as Record<string, unknown>).params;
\t} catch {
\t\treturn new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
\t}
\tlet serverModule: Record<string, unknown>;
\ttry {
\t\tserverModule = (await import('./server/functions.ts')) as Record<string, unknown>;
\t} catch (err) {
\t\tconst message = err instanceof Error ? err.message : String(err);
\t\treturn new Response(JSON.stringify({ success: false, error: \`Failed to load server/functions.ts: \${message}\` }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
\t}
\tconst fn = serverModule[functionName];
\tif (typeof fn !== 'function') {
\t\treturn new Response(JSON.stringify({ success: false, error: \`Function '\${functionName}' not found in server/functions.ts\` }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
\t}
\ttry {
\t\tconst context = buildContext(pool);
\t\tconst result = await (fn as (params: unknown, context: RemoteContext) => Promise<unknown>)(params, context);
\t\treturn new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
\t} catch (err) {
\t\tconst message = err instanceof Error ? err.message : String(err);
\t\treturn new Response(JSON.stringify({ success: false, error: message }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
\t}
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
\tconsole.error('[DevServer] HIBA: DATABASE_URL környezeti változó nincs beállítva. Állítsd be a .env fájlban.');
\tprocess.exit(1);
}

const pool = createPool(DATABASE_URL);

process.on('SIGINT', async () => { console.log('\\n[DevServer] Leállítás (SIGINT)...'); await pool.end(); process.exit(0); });
process.on('SIGTERM', async () => { console.log('[DevServer] Leállítás (SIGTERM)...'); await pool.end(); process.exit(0); });

(async () => {
\tconsole.log('[DevServer] Plugin dev szerver indul...');
\tawait checkDbConnection(pool);
\tconsole.log('[DevServer] Migrációk futtatása...');
\tawait runMigrations(pool);

\tserve({
\t\tport: PORT,
\t\tasync fetch(req) {
\t\t\tconst url = new URL(req.url);
\t\t\tconst pathname = url.pathname;
\t\t\tconst corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*' };

\t\t\tif (req.method === 'OPTIONS' && pathname.startsWith('/api/remote/')) {
\t\t\t\treturn new Response(null, { status: 204, headers: corsHeaders });
\t\t\t}
\t\t\tif (req.method === 'POST' && pathname.startsWith('/api/remote/')) {
\t\t\t\treturn handleRemoteRequest(req, pathname.slice('/api/remote/'.length), pool);
\t\t\t}
\t\t\tif (req.method === 'OPTIONS') {
\t\t\t\treturn new Response(null, { status: 204, headers: corsHeaders });
\t\t\t}

\t\t\tconst staticPathname = pathname === '/' ? '/index.html' : pathname;
\t\t\tconst safePath = normalize(staticPathname).replace(/^(\\.\\.(\\\/|\\\\|$))+/, '');
\t\t\tconst searchPaths = [join(ROOT, 'dist', safePath), join(ROOT, safePath)];

\t\t\tfor (const filePath of searchPaths) {
\t\t\t\tconst resolvedPath = resolve(filePath);
\t\t\t\tif (!resolvedPath.startsWith(ROOT + '/') && resolvedPath !== ROOT) {
\t\t\t\t\treturn new Response('Forbidden', { status: 403, headers: corsHeaders });
\t\t\t\t}
\t\t\t\ttry {
\t\t\t\t\tconst content = await readFile(resolvedPath);
\t\t\t\t\tconst ext = extname(resolvedPath);
\t\t\t\t\treturn new Response(content, { headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream', ...corsHeaders } });
\t\t\t\t} catch { /* Nem található */ }
\t\t\t}
\t\t\treturn new Response('Not Found', { status: 404, headers: corsHeaders });
\t\t}
\t});

\tconsole.log(\`[DevServer] Plugin dev szerver fut: http://localhost:\${PORT}\`);
\tconsole.log(\`[DevServer] Remote endpoint: POST http://localhost:\${PORT}/api/remote/:functionName\`);
\tconsole.log('[DevServer] Futtasd párhuzamosan: bun run dev');
})();
`;
}

// ---------------------------------------------------------------------------
// plugin.ts generálás
// ---------------------------------------------------------------------------

function generatePluginTs(config: PluginConfig): string {
	const idUnderscore = config.pluginId.replace(/-/g, '_');
	return `/**
 * Plugin IIFE build entry point.
 * ElyOS tölti be ezt a bundle-t Web Component-ként.
 */
import { mount } from 'svelte';
import App from './App.svelte';

function ${idUnderscore}_Plugin() {
\tconst tagName = '${config.pluginId}-plugin';
\tif (!customElements.get(tagName)) {
\t\tclass PluginElement extends HTMLElement {
\t\t\tconnectedCallback() {
\t\t\t\tmount(App, { target: this });
\t\t\t}
\t\t}
\t\tcustomElements.define(tagName, PluginElement);
\t}
\treturn { tagName };
}

(window as any).${idUnderscore}_Plugin = ${idUnderscore}_Plugin;
export default ${idUnderscore}_Plugin;
`;
}

// ---------------------------------------------------------------------------
// Sidebar-specifikus fájlok
// ---------------------------------------------------------------------------

function generateBuildAllJs(config: PluginConfig): string {
	return `/**
 * Build All Script
 *
 * Builds the main plugin and all sidebar components.
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const __dirname = import.meta.dir;

console.log('🔨 Building ${config.displayName} plugin...\\n');

// 1. Build main plugin
console.log('📦 Building main plugin...');
try {
	execSync('BUILD_MODE=main vite build', { stdio: 'inherit', cwd: __dirname });
	console.log('✅ Main plugin built successfully\\n');
} catch (error) {
	console.error('❌ Failed to build main plugin');
	process.exit(1);
}

// 2. Build components
const componentsDir = resolve(__dirname, 'src/components');
if (existsSync(componentsDir)) {
	const files = readdirSync(componentsDir);
	const svelteFiles = files.filter((f) => f.endsWith('.svelte'));

	if (svelteFiles.length > 0) {
		console.log('📦 Building components...');

		for (const file of svelteFiles) {
			console.log(\`  - Building \${file}...\`);
			try {
				execSync(\`BUILD_MODE=components COMPONENT_FILE=\${file} vite build\`, {
					stdio: 'inherit',
					cwd: __dirname
				});
			} catch (error) {
				console.error(\`❌ Failed to build component: \${file}\`);
				process.exit(1);
			}
		}

		console.log('✅ All components built successfully\\n');
	}
}

console.log('🎉 ${config.displayName} build completed successfully!');
`;
}

function writeMenuJson(dir: string, config: PluginConfig): void {
	const hasI18n = hasFeature(config, 'i18n');

	// Alap menüpontok
	const items: any[] = hasI18n
		? [
				{ labelKey: 'menu.overview', href: '#overview', icon: 'Info', component: 'Overview' },
				{ labelKey: 'menu.settings', href: '#settings', icon: 'Settings', component: 'Settings' }
			]
		: [
				{ label: 'Overview', href: '#overview', icon: 'Info', component: 'Overview' },
				{ label: 'Settings', href: '#settings', icon: 'Settings', component: 'Settings' }
			];

	// Feature-specifikus menüpontok
	if (hasFeature(config, 'datatable')) {
		items.push(
			hasI18n
				? { labelKey: 'menu.datatable', href: '#datatable', icon: 'Table', component: 'Datatable' }
				: { label: 'Data Table', href: '#datatable', icon: 'Table', component: 'Datatable' }
		);
	}
	if (hasFeature(config, 'notifications')) {
		items.push(
			hasI18n
				? {
						labelKey: 'menu.notifications',
						href: '#notifications',
						icon: 'Bell',
						component: 'Notifications'
					}
				: {
						label: 'Notifications',
						href: '#notifications',
						icon: 'Bell',
						component: 'Notifications'
					}
		);
	}
	if (hasFeature(config, 'remote_functions')) {
		items.push(
			hasI18n
				? { labelKey: 'menu.remote', href: '#remote', icon: 'Zap', component: 'Remote' }
				: { label: 'Remote', href: '#remote', icon: 'Zap', component: 'Remote' }
		);
	}

	writeFileSync(join(dir, 'menu.json'), JSON.stringify(items, null, '\t') + '\n');
}

function generateOverviewSvelte(config: PluginConfig): string {
	const idUnderscore = config.pluginId.replace(/-/g, '_');
	const tagName = `${config.pluginId}-overview`;
	const moduleBlock = `<script module lang="ts">
\tif (typeof window !== 'undefined') {
\t\t(window as any).${idUnderscore}_Component_Overview = function () {
\t\t\treturn { tagName: '${tagName}' };
\t\t};
\t}
</script>`;

	if (hasFeature(config, 'i18n')) {
		return `<svelte:options customElement={{ tag: '${tagName}', shadow: 'none' }} />

${moduleBlock}

<script lang="ts">
\timport { onMount } from 'svelte';

\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();

\tconst sdk = $derived(
\t\t(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
\t);

\tlet ready = $state(false);

\tonMount(async () => {
\t\tawait sdk?.i18n?.ready?.();
\t\tready = true;
\t});

\tfunction t(key: string): string {
\t\tif (!ready) return '';
\t\treturn sdk?.i18n?.t(key) ?? key;
\t}
</script>

<div class="page">
\t<h2>{t('overview.title')}</h2>
\t<p>{t('overview.description')}</p>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
	}

	return `<svelte:options customElement={{ tag: '${tagName}', shadow: 'none' }} />

${moduleBlock}

<script lang="ts">
\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();
</script>

<div class="page">
\t<h2>Overview</h2>
\t<p>Your content here.</p>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
}

function generateSettingsSvelte(config: PluginConfig): string {
	const idUnderscore = config.pluginId.replace(/-/g, '_');
	const tagName = `${config.pluginId}-settings`;
	const moduleBlock = `<script module lang="ts">
\tif (typeof window !== 'undefined') {
\t\t(window as any).${idUnderscore}_Component_Settings = function () {
\t\t\treturn { tagName: '${tagName}' };
\t\t};
\t}
</script>`;

	if (hasFeature(config, 'i18n')) {
		return `<svelte:options customElement={{ tag: '${tagName}', shadow: 'none' }} />

${moduleBlock}

<script lang="ts">
\timport { onMount } from 'svelte';

\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();

\tconst sdk = $derived(
\t\t(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
\t);

\tlet ready = $state(false);

\tonMount(async () => {
\t\tawait sdk?.i18n?.ready?.();
\t\tready = true;
\t});

\tfunction t(key: string): string {
\t\tif (!ready) return '';
\t\treturn sdk?.i18n?.t(key) ?? key;
\t}
</script>

<div class="page">
\t<h2>{t('settings.title')}</h2>
\t<p>{t('settings.description')}</p>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
	}

	return `<svelte:options customElement={{ tag: '${tagName}', shadow: 'none' }} />

${moduleBlock}

<script lang="ts">
\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();
</script>

<div class="page">
\t<h2>Settings</h2>
\t<p>Your settings here.</p>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
`;
}

function generateDatatableSvelte(config: PluginConfig): string {
	const hasI18n = hasFeature(config, 'i18n');
	const hasDb = hasFeature(config, 'database');
	const titleExpr = hasI18n ? `{t('datatable.title')}` : 'Data Table';
	const i18nBlock = hasI18n
		? `
\tfunction t(key: string): string { return sdk?.i18n?.t(key) ?? key; }`
		: `
\tfunction t(key: string): string { return key; }`;

	const col = (key: string, fallback: string) => (hasI18n ? `t('${key}')` : `'${fallback}'`);

	const dataLoadFn = hasDb
		? `\tasync function loadData() {
\t\tloading = true;
\t\ttry {
\t\t\tconst result = await sdk?.remote?.call<{ data: Row[]; pagination: typeof paginationInfo }>('getItems', {
\t\t\t\tpage: tableState.page,
\t\t\t\tpageSize: tableState.pageSize,
\t\t\t\tsortBy: tableState.sortBy,
\t\t\t\tsortOrder: tableState.sortOrder
\t\t\t});
\t\t\tdata = result?.data ?? [];
\t\t\tpaginationInfo = result?.pagination ?? { page: 1, pageSize: data.length, totalCount: data.length, totalPages: 1 };
\t\t} catch (err: any) {
\t\t\tsdk?.ui?.toast(${col('datatable.error.loadFailed', 'Failed to load data')}, 'error');
\t\t} finally { loading = false; }
\t}

\tlet formName = $state('');
\tlet formValue = $state('');
\tlet submitting = $state(false);

\tasync function handleInsert(e: SubmitEvent) {
\t\te.preventDefault();
\t\tif (!formName.trim()) return;
\t\tsubmitting = true;
\t\ttry {
\t\t\tawait sdk?.remote?.call('insertItem', { name: formName.trim(), value: formValue.trim() });
\t\t\tformName = '';
\t\t\tformValue = '';
\t\t\tawait loadData();
\t\t\tsdk?.ui?.toast(${col('datatable.success.itemAdded', 'Item added')}, 'success');
\t\t} catch (err: any) {
\t\t\tsdk?.ui?.toast(${col('datatable.error.insertFailed', 'Failed to insert item')}, 'error');
\t\t} finally { submitting = false; }
\t}

\tasync function deleteItem(row: Row) {
\t\tconst confirmed = await sdk?.ui?.dialog({
\t\t\ttitle: ${col('datatable.delete.title', 'Delete item')},
\t\t\tmessage: \`\${${col('datatable.delete.message', 'Are you sure you want to delete')}} "\${row.name}"?\`,
\t\t\ttype: 'confirm',
\t\t\tconfirmLabel: ${col('datatable.delete.confirm', 'Delete')},
\t\t\tconfirmVariant: 'destructive'
\t\t});
\t\tif (confirmed?.action !== 'confirm') return;
\t\ttry {
\t\t\tawait sdk?.remote?.call('deleteItem', { id: row.id });
\t\t\tawait loadData();
\t\t\tsdk?.ui?.toast(${col('datatable.success.itemDeleted', 'Item deleted')}, 'success');
\t\t} catch (err: any) {
\t\t\tsdk?.ui?.toast(${col('datatable.error.deleteFailed', 'Failed to delete item')}, 'error');
\t\t}
\t}

\tasync function duplicateItem(row: Row) {
\t\ttry {
\t\t\tawait sdk?.remote?.call('duplicateItem', { id: row.id });
\t\t\tawait loadData();
\t\t\tsdk?.ui?.toast(${col('datatable.success.itemDuplicated', 'Item duplicated')}, 'success');
\t\t} catch (err: any) {
\t\t\tsdk?.ui?.toast(${col('datatable.error.duplicateFailed', 'Failed to duplicate item')}, 'error');
\t\t}
\t}`
		: `\tasync function loadData() {
\t\tloading = true;
\t\ttry {
\t\t\tconst saved = await sdk?.data?.get<Row[]>('items');
\t\t\tdata = saved ?? [];
\t\t\tpaginationInfo = { page: 1, pageSize: data.length, totalCount: data.length, totalPages: 1 };
\t\t} catch (err: any) {
\t\t\tsdk?.ui?.toast(${col('datatable.error.loadFailed', 'Failed to load data')}, 'error');
\t\t} finally { loading = false; }
\t}`;

	return `<svelte:options customElement={{ tag: '${config.pluginId}-datatable', shadow: 'none' }} />

<script module lang="ts">
\tif (typeof window !== 'undefined') {
\t\t(window as any).${config.pluginId.replace(/-/g, '_')}_Component_Datatable = function () {
\t\t\treturn { tagName: '${config.pluginId}-datatable' };
\t\t};
\t}
</script>

<script lang="ts">
\timport { onMount, createRawSnippet } from 'svelte';
\timport SimpleDataTable from '@elyos-dev/sdk/dev/components/SimpleDataTable.svelte';
${i18nBlock}
\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();
\tconst sdk = $derived(
\t\t(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
\t);

\t// SDK DataTable komponensek
\tconst DataTable = $derived(sdk?.components?.DataTable);
\tconst DataTableColumnHeader = $derived(sdk?.components?.DataTableColumnHeader);
\tconst renderComponent = $derived(sdk?.components?.renderComponent);
\tconst renderSnippet = $derived(sdk?.components?.renderSnippet);
\tconst createActionsColumn = $derived(sdk?.components?.createActionsColumn);

\t// Standalone módban SimpleDataTable-t használunk közvetlenül (reaktív prop frissítés)
\t// Core módban a valódi DataTable-t (svelte:component)
\tconst CoreDataTable = $derived(DataTable !== SimpleDataTable ? DataTable : null);

\tinterface Row { id: number; name: string; value: string; }

\tlet data = $state<Row[]>([]);
\tlet loading = $state(false);
\tlet paginationInfo = $state({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
\tlet tableState = $state({ page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'asc' as 'asc' | 'desc' });
\tlet columns = $state<any[]>([]);

${dataLoadFn}

\tfunction handleStateChange(state: any) {
\t\ttableState = state;
\t\tloadData();
\t}

\tfunction buildColumns() {
\t\tif (!renderComponent || !renderSnippet) return;

\t\tconst handleSort = (columnId: string, desc: boolean) => {
\t\t\ttableState = { ...tableState, sortBy: columnId, sortOrder: desc ? 'desc' : 'asc', page: 1 };
\t\t};

${
	hasDb
		? `\t\tconst actionsColumn = createActionsColumn?.((row: Row) => [
\t\t\t{
\t\t\t\tlabel: ${hasFeature(config, 'i18n') ? "t('datatable.duplicate')" : "'Duplicate'"},
\t\t\t\tonClick: () => duplicateItem(row)
\t\t\t},
\t\t\t{
\t\t\t\tlabel: ${hasFeature(config, 'i18n') ? "t('datatable.delete')" : "'Delete'"},
\t\t\t\tonClick: () => deleteItem(row),
\t\t\t\tvariant: 'destructive' as const,
\t\t\t\tseparator: true
\t\t\t}
\t\t]);

`
		: ''
}
\t\tcolumns = [
\t\t\t{
\t\t\t\taccessorKey: 'id',
\t\t\t\tmeta: { title: ${col('datatable.columns.id', 'ID')} },
\t\t\t\theader: ({ column }: any) => renderComponent(DataTableColumnHeader, {
\t\t\t\t\tget column() { return column; },
\t\t\t\t\tget title() { return ${col('datatable.columns.id', 'ID')}; },
\t\t\t\t\tonSort: handleSort
\t\t\t\t}),
\t\t\t\tcell: ({ row }: any) => {
\t\t\t\t\tconst val = String(row.original.id);
\t\t\t\t\treturn renderSnippet(createRawSnippet(() => ({ render: () => \`<span class="text-sm">\${val}</span>\` })), {});
\t\t\t\t}
\t\t\t},
\t\t\t{
\t\t\t\taccessorKey: 'name',
\t\t\t\tmeta: { title: ${col('datatable.columns.name', 'Name')} },
\t\t\t\theader: ({ column }: any) => renderComponent(DataTableColumnHeader, {
\t\t\t\t\tget column() { return column; },
\t\t\t\t\tget title() { return ${col('datatable.columns.name', 'Name')}; },
\t\t\t\t\tonSort: handleSort
\t\t\t\t}),
\t\t\t\tcell: ({ row }: any) => {
\t\t\t\t\tconst val = row.original.name ?? '—';
\t\t\t\t\treturn renderSnippet(createRawSnippet(() => ({ render: () => \`<span class="font-medium">\${val}</span>\` })), {});
\t\t\t\t}
\t\t\t},
\t\t\t{
\t\t\t\taccessorKey: 'value',
\t\t\t\tmeta: { title: ${col('datatable.columns.value', 'Value')} },
\t\t\t\theader: ({ column }: any) => renderComponent(DataTableColumnHeader, {
\t\t\t\t\tget column() { return column; },
\t\t\t\t\tget title() { return ${col('datatable.columns.value', 'Value')}; },
\t\t\t\t\tonSort: handleSort
\t\t\t\t}),
\t\t\t\tcell: ({ row }: any) => {
\t\t\t\t\tconst val = row.original.value ?? '—';
\t\t\t\t\treturn renderSnippet(createRawSnippet(() => ({ render: () => \`<span class="text-sm text-muted-foreground">\${val}</span>\` })), {});
\t\t\t\t}
\t\t\t}${
		hasDb
			? `,
\t\t\t...(actionsColumn ? [actionsColumn] : [])`
			: ''
	}
\t\t];
\t}

\tonMount(() => {
\t\tbuildColumns();
\t\tloadData();
\t});
</script>

<div class="page">
\t<h2>${titleExpr}</h2>

\t{#if columns.length > 0}
\t\t{#if CoreDataTable}
\t\t\t<!-- Core módban: valódi DataTable -->
\t\t\t{#key data}
\t\t\t\t<!-- svelte-ignore svelte_component_deprecated -->
\t\t\t\t<svelte:component
\t\t\t\t\tthis={CoreDataTable}
\t\t\t\t\t{columns}
\t\t\t\t\t{data}
\t\t\t\t\tpagination={paginationInfo}
\t\t\t\t\t{loading}
\t\t\t\t\tonStateChange={handleStateChange}
\t\t\t\t/>
\t\t\t{/key}
\t\t{:else}
\t\t\t<!-- Standalone módban: SimpleDataTable közvetlenül -->
\t\t\t<SimpleDataTable
\t\t\t\t{columns}
\t\t\t\t{data}
\t\t\t\tpagination={paginationInfo}
\t\t\t\t{loading}
\t\t\t\tonStateChange={handleStateChange}
\t\t\t/>
\t\t{/if}
\t{:else}
\t\t<div class="loading-state">
\t\t\t<div class="spinner"></div>
\t\t</div>
\t{/if}
${
	hasDb
		? `
\t<form class="insert-form" onsubmit={handleInsert}>
\t\t<h3>{${col('datatable.form.title', 'Add item')}}</h3>
\t\t<div class="form-row">
\t\t\t<label class="form-label">
\t\t\t\t{${col('datatable.form.name', 'Name')}} *
\t\t\t\t<input class="form-input" type="text" placeholder={${col('datatable.form.name', 'Name')}} bind:value={formName} required disabled={submitting} />
\t\t\t</label>
\t\t\t<label class="form-label">
\t\t\t\t{${col('datatable.form.value', 'Value')}}
\t\t\t\t<input class="form-input" type="text" placeholder={${col('datatable.form.value', 'Value')}} bind:value={formValue} disabled={submitting} />
\t\t\t</label>
\t\t</div>
\t\t<div class="form-actions">
\t\t\t<button class="btn-primary" type="submit" disabled={submitting}>
\t\t\t\t{submitting ? ${col('datatable.form.saving', 'Saving...')} : ${col('datatable.form.submit', 'Add item')}}
\t\t\t</button>
\t\t</div>
\t</form>`
		: ''
}
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
\t.loading-state {
\t\tdisplay: flex;
\t\talign-items: center;
\t\tjustify-content: center;
\t\tpadding: 3rem;
\t}
\t.spinner {
\t\twidth: 1.5rem;
\t\theight: 1.5rem;
\t\tborder: 2px solid #e2e8f0;
\t\tborder-top-color: #6366f1;
\t\tborder-radius: 50%;
\t\tanimation: spin 0.7s linear infinite;
\t}
\t@keyframes spin { to { transform: rotate(360deg); } }
\t.insert-form {
\t\tmargin-top: 1.5rem;
\t\tpadding-top: 1.5rem;
\t\tborder-top: 1px solid var(--color-border, #e2e8f0);
\t}
\t.insert-form h3 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; }
\t.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
\t.form-label {
\t\tdisplay: flex;
\t\tflex-direction: column;
\t\tgap: 0.25rem;
\t\tfont-size: 0.875rem;
\t\tfont-weight: 500;
\t\tflex: 1;
\t\tmin-width: 160px;
\t}
\t.form-input {
\t\tborder: 1px solid var(--color-border, #e2e8f0);
\t\tborder-radius: 0.375rem;
\t\tpadding: 0.4rem 0.75rem;
\t\tfont-size: 0.875rem;
\t\tbackground: var(--color-background, #fff);
\t\tcolor: var(--color-foreground, #0f172a);
\t}
\t.form-input:focus {
\t\toutline: 2px solid var(--color-primary, #3730a3);
\t\toutline-offset: 1px;
\t}
\t.form-actions { margin-top: 0.75rem; }
\t.btn-primary {
\t\tbackground: var(--color-primary, #3730a3);
\t\tcolor: #fff;
\t\tborder: none;
\t\tpadding: 0.5rem 1rem;
\t\tborder-radius: 0.375rem;
\t\tcursor: pointer;
\t\tfont-size: 0.875rem;
\t\tfont-weight: 500;
\t}
\t.btn-primary:hover { opacity: 0.9; }
\t.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
\t:global(.dark) .form-input {
\t\tbackground: var(--color-input, oklch(1 0 0 / 15%));
\t\tborder-color: var(--color-border, oklch(1 0 0 / 10%));
\t\tcolor: var(--color-foreground, oklch(0.985 0 0));
\t}
\t:global(.dark) .insert-form {
\t\tborder-color: var(--color-border, oklch(1 0 0 / 10%));
\t}
</style>
`;
}

function generateNotificationsSvelte(config: PluginConfig): string {
	const titleExpr = hasFeature(config, 'i18n') ? `{t('notifications.title')}` : 'Notifications';
	const btnExpr = hasFeature(config, 'i18n') ? `{t('notifications.send')}` : 'Send notification';
	const i18nScript = hasFeature(config, 'i18n')
		? `
\timport { onMount } from 'svelte';
\tlet ready = $state(false);
\tonMount(async () => { await sdk?.i18n?.ready?.(); ready = true; });
\tfunction t(key: string): string { if (!ready) return ''; return sdk?.i18n?.t(key) ?? key; }`
		: '';

	return `<svelte:options customElement={{ tag: '${config.pluginId}-notifications', shadow: 'none' }} />

<script module lang="ts">
\tif (typeof window !== 'undefined') {
\t\t(window as any).${config.pluginId.replace(/-/g, '_')}_Component_Notifications = function () {
\t\t\treturn { tagName: '${config.pluginId}-notifications' };
\t\t};
\t}
</script>

<script lang="ts">
${i18nScript}
\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();
\tconst sdk = $derived(
\t\t(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
\t);

\tasync function sendNotification() {
\t\tawait sdk?.notifications?.send({
\t\t\tuserId: sdk?.context?.user?.id ?? '',
\t\t\ttitle: '${config.displayName}',
\t\t\tmessage: 'Hello from ${config.displayName}!',
\t\t\ttype: 'info'
\t\t});
\t}
</script>

<div class="page">
\t<h2>${titleExpr}</h2>
\t<button class="btn-primary" onclick={sendNotification}>${btnExpr}</button>
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
\t.btn-primary {
\t\tbackground: var(--color-primary, #3730a3);
\t\tcolor: #fff;
\t\tborder: none;
\t\tpadding: 0.5rem 1rem;
\t\tborder-radius: 0.375rem;
\t\tcursor: pointer;
\t\tfont-size: 0.875rem;
\t\tfont-weight: 500;
\t}
\t.btn-primary:hover { opacity: 0.9; }
\t.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
`;
}

function generateRemoteSvelte(config: PluginConfig): string {
	const titleExpr = hasFeature(config, 'i18n') ? `{t('remote.title')}` : 'Remote Functions';
	const btnExpr = hasFeature(config, 'i18n') ? `{t('remote.call')}` : 'Call server';
	const i18nScript = hasFeature(config, 'i18n')
		? `
\timport { onMount } from 'svelte';
\tlet ready = $state(false);
\tonMount(async () => { await sdk?.i18n?.ready?.(); ready = true; });
\tfunction t(key: string): string { if (!ready) return ''; return sdk?.i18n?.t(key) ?? key; }`
		: '';

	return `<svelte:options customElement={{ tag: '${config.pluginId}-remote', shadow: 'none' }} />

<script module lang="ts">
\tif (typeof window !== 'undefined') {
\t\t(window as any).${config.pluginId.replace(/-/g, '_')}_Component_Remote = function () {
\t\t\treturn { tagName: '${config.pluginId}-remote' };
\t\t};
\t}
</script>

<script lang="ts">
${i18nScript}
\tlet { pluginId = 'my-plugin' }: { pluginId?: string } = $props();
\tconst sdk = $derived(
\t\t(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
\t);

\tlet result = $state('');

\tasync function callExample() {
\t\tconst res = await sdk?.remote?.call<{ result: string }>('example');
\t\tresult = res?.result ?? 'No response';
\t}
</script>

<div class="page">
\t<h2>${titleExpr}</h2>
\t<button class="btn-primary" onclick={callExample}>${btnExpr}</button>
\t{#if result}<p class="result">{result}</p>{/if}
</div>

<style>
\t.page { padding: 2rem; font-family: system-ui, sans-serif; }
\t.btn-primary {
\t\tbackground: var(--color-primary, #3730a3);
\t\tcolor: #fff;
\t\tborder: none;
\t\tpadding: 0.5rem 1rem;
\t\tborder-radius: 0.375rem;
\t\tcursor: pointer;
\t\tfont-size: 0.875rem;
\t\tfont-weight: 500;
\t}
\t.btn-primary:hover { opacity: 0.9; }
\t.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
\t.result {
\t\tmargin-top: 1rem;
\t\tpadding: 0.75rem;
\t\tbackground: var(--color-accent, #f8fafc);
\t\tborder-radius: 0.375rem;
\t\tfont-family: monospace;
\t\tfont-size: 0.875rem;
\t\tcolor: var(--color-foreground, #0f172a);
\t}
\t:global(.dark) .result {
\t\tbackground: var(--color-accent, oklch(0.269 0 0));
\t\tcolor: var(--color-foreground, oklch(0.985 0 0));
\t}
</style>
`;
}

// ---------------------------------------------------------------------------
// Database-specifikus fájlok
// ---------------------------------------------------------------------------

function writeDatabaseFiles(dir: string, config: PluginConfig): void {
	const pluginIdUnderscore = config.pluginId.replace(/-/g, '_');

	// migrations/001_init.sql
	writeFileSync(
		join(dir, 'migrations', '001_init.sql'),
		`-- ${config.pluginId} kezdeti séma
-- A táblaneveket a telepítő automatikusan prefixeli a plugin sémájával (plugin__${pluginIdUnderscore})
-- Nem kell séma prefixet írni — az ElyOS installer automatikusan hozzáadja.

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_created_at ON items (created_at);
`
	);

	// migrations/dev/000_auth_seed.sql
	mkdirSync(join(dir, 'migrations', 'dev'), { recursive: true });
	writeFileSync(
		join(dir, 'migrations', 'dev', '000_auth_seed.sql'),
		`-- Dev környezet: minimális auth séma
-- Éles rendszerben az auth sémát a better-auth kezeli.
-- Ez a fájl NEM kerül bele az éles .elyospkg csomagba (migrations/dev/ almappa).
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id             SERIAL PRIMARY KEY,
    full_name      VARCHAR(255),
    email          VARCHAR(255) UNIQUE NOT NULL,
    image          TEXT,
    email_verified BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS auth.accounts (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_account_id VARCHAR(255),
    provider_id         VARCHAR(100) DEFAULT 'credential',
    is_active           BOOLEAN DEFAULT true
);

-- Dev seed: egy tesztfelhasználó
INSERT INTO auth.users (full_name, email, email_verified)
VALUES ('Dev User', 'dev@example.com', true)
ON CONFLICT (email) DO NOTHING;
`
	);

	// docker-compose.dev.yml
	writeFileSync(
		join(dir, 'docker-compose.dev.yml'),
		`version: '3.8'

services:
  __PLUGIN_ID__-db:
    image: postgres:18-alpine
    container_name: __PLUGIN_ID__-db
    ports:
      - '5433:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: __PLUGIN_ID_UNDERSCORE___dev
    volumes:
      - __PLUGIN_ID__-db-data:/var/lib/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d __PLUGIN_ID_UNDERSCORE___dev']
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  __PLUGIN_ID__-db-data:
    name: __PLUGIN_ID__-db-data
`
	);

	// .env.example
	writeFileSync(
		join(dir, '.env.example'),
		`# PostgreSQL kapcsolati URL a helyi fejlesztői adatbázishoz
# Formátum: postgresql://<user>:<password>@<host>:<port>/<database>
# A docker-compose.dev.yml alapértelmezett értékeivel:
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/__PLUGIN_ID_UNDERSCORE___dev

# A dev-server portja (alapértelmezett: 5175)
PORT=5175

# A fejlesztői munkamenethez használt felhasználói azonosító
DEV_USER_ID=dev-user
`
	);
}

// ---------------------------------------------------------------------------
// server/functions.ts generálás
// ---------------------------------------------------------------------------

function generateServerFunctions(): string {
	return `/**
 * Szerver oldali függvények
 *
 * Minden exportált async függvény elérhető a kliens oldalon
 * az sdk.remote.call('<functionName>', params) hívással.
 */

interface RemoteContext {
\tpluginId: string;
\tuserId: string;
\tdb: {
\t\tquery: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
\t};
\tpermissions: string[];
}

export async function example(
\t_params: unknown,
\t_context: RemoteContext
): Promise<{ result: string }> {
\treturn { result: 'Hello from server!' };
}

export async function getItems(
\tparams: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string },
\tcontext: RemoteContext
): Promise<{ data: Array<{ id: number; name: string; value: string }>; pagination: { page: number; pageSize: number; totalCount: number; totalPages: number } }> {
\tconst schema = \`app__\${context.pluginId.replace(/-/g, '_')}\`;
\tconst page = params.page ?? 1;
\tconst pageSize = params.pageSize ?? 20;
\tconst offset = (page - 1) * pageSize;
\tconst sortBy = ['id', 'name', 'value'].includes(params.sortBy ?? '') ? params.sortBy : 'id';
\tconst sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

\tconst countResult = await context.db.query(\`SELECT COUNT(*) as count FROM \${schema}.items\`);
\tconst totalCount = parseInt(String((countResult.rows[0] as any).count), 10);

\tconst result = await context.db.query(
\t\t\`SELECT id, name, value#>>'{}' as value FROM \${schema}.items ORDER BY \${sortBy} \${sortOrder} LIMIT $1 OFFSET $2\`,
\t\t[pageSize, offset]
\t);

\treturn {
\t\tdata: result.rows as Array<{ id: number; name: string; value: string }>,
\t\tpagination: {
\t\t\tpage,
\t\t\tpageSize,
\t\t\ttotalCount,
\t\t\ttotalPages: Math.max(1, Math.ceil(totalCount / pageSize))
\t\t}
\t};
}

export async function insertItem(
\tparams: { name: string; value?: string },
\tcontext: RemoteContext
): Promise<{ id: number }> {
\tconst schema = \`app__\${context.pluginId.replace(/-/g, '_')}\`;
\tconst jsonValue = params.value != null ? JSON.stringify(params.value) : null;
\tconst result = await context.db.query(
\t\t\`INSERT INTO \${schema}.items (name, value) VALUES ($1, $2::jsonb) RETURNING id\`,
\t\t[params.name, jsonValue]
\t);
\tconst rows = result.rows as Array<{ id: number }>;
\treturn { id: rows[0].id };
}

export async function deleteItem(
\tparams: { id: number },
\tcontext: RemoteContext
): Promise<void> {
\tconst schema = \`app__\${context.pluginId.replace(/-/g, '_')}\`;
\tawait context.db.query(
\t\t\`DELETE FROM \${schema}.items WHERE id = $1\`,
\t\t[params.id]
\t);
}

export async function duplicateItem(
\tparams: { id: number },
\tcontext: RemoteContext
): Promise<{ id: number }> {
\tconst schema = \`app__\${context.pluginId.replace(/-/g, '_')}\`;
\tconst result = await context.db.query(
\t\t\`INSERT INTO \${schema}.items (name, value)
\t\t SELECT name, value FROM \${schema}.items WHERE id = $1
\t\t RETURNING id\`,
\t\t[params.id]
\t);
\tconst rows = result.rows as Array<{ id: number }>;
\treturn { id: rows[0].id };
}
`;
}

// ---------------------------------------------------------------------------
// manifest.json, package.json, README.md
// ---------------------------------------------------------------------------

function writeManifest(dir: string, config: PluginConfig): void {
	const manifest: PluginManifest = {
		id: config.pluginId,
		name: { hu: config.displayName, en: config.displayName },
		description: { hu: config.description, en: config.description },
		version: '1.0.0',
		author: config.author,
		entry: 'dist/index.iife.js',
		icon: 'icon.svg',
		iconStyle: 'cover',
		category: 'utilities',
		permissions: computePermissions(config.features),
		multiInstance: false,
		defaultSize: { width: 800, height: 600 },
		minSize: { width: 400, height: 300 },
		maxSize: { width: 1920, height: 1080 },
		keywords: [],
		isPublic: true,
		sortOrder: 100,
		dependencies: {
			svelte: '^5.0.0',
			'@lucide/svelte': '^1.0.0'
		},
		minWebOSVersion: '1.0.0',
		locales: ['hu', 'en']
	};
	writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');
}

function writePackageJson(dir: string, config: PluginConfig): void {
	const isSidebar = hasFeature(config, 'sidebar');
	const hasDb = hasFeature(config, 'database');
	const hasRemote = hasFeature(config, 'remote_functions');

	const pkg = {
		name: `${config.pluginId}-plugin`,
		version: '1.0.0',
		description: config.description,
		type: 'module',
		scripts: {
			dev: 'vite',
			...(hasRemote ? { 'dev:server': 'bun dev-server.ts' } : {}),
			build: isSidebar ? 'bun build-all.js' : 'vite build',
			'build:watch': 'vite build --watch',
			preview: 'vite preview',
			package: 'bun build-package.js',
			...(hasDb
				? {
						'db:up': 'docker compose -f docker-compose.dev.yml up -d',
						'db:down': 'docker compose -f docker-compose.dev.yml down',
						'dev:full': 'bun run --parallel dev:server dev'
					}
				: {})
		},
		dependencies: {
			'@racona/sdk': '^0.3.0',
			svelte: '^5.0.0',
			'@lucide/svelte': '^1.0.0'
		},
		devDependencies: {
			'@sveltejs/vite-plugin-svelte': '^5.0.0',
			vite: '^6.0.0',
			typescript: '^5.7.0',
			'vite-plugin-css-injected-by-js': '^4.0.0',
			...(hasDb ? { pg: '^8.0.0', '@types/pg': '^8.0.0' } : {})
		}
	};
	writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n');
}

function writeReadme(dir: string, config: PluginConfig): void {
	const isSidebar = hasFeature(config, 'sidebar');
	const hasDb = hasFeature(config, 'database');
	const hasRemote = hasFeature(config, 'remote_functions');
	const hasI18n = hasFeature(config, 'i18n');

	const devSection = hasDb
		? `\`\`\`bash
# 1. Set up environment variables
cp .env.example .env

# 2. Start the dev database (Docker)
bun db:up

# 3. Start the dev server — this also runs migrations (separate terminal)
bun dev:server

# 4. Start the Vite dev server (separate terminal)
bun dev
\`\`\`

> **Note:** Migrations run automatically when \`bun dev:server\` starts,
> not when \`bun db:up\` runs. \`db:up\` only starts the Docker Postgres container.

One-step startup (dev:server + dev in parallel):
\`\`\`bash
bun dev:full
\`\`\``
		: `\`\`\`bash
bun dev
\`\`\``;

	const structureLines = [
		'- `src/App.svelte` — main component',
		'- `src/main.ts` — entry point',
		'- `src/plugin.ts` — IIFE build entry',
		isSidebar ? '- `src/components/` — sidebar components' : '',
		hasRemote ? '- `server/functions.ts` — server-side functions' : '',
		hasI18n ? '- `locales/` — translations (hu, en)' : '',
		hasDb ? '- `migrations/` — SQL migrations' : '',
		hasDb ? '- `docker-compose.dev.yml` — local dev database' : '',
		'- `assets/icon.svg` — app icon',
		'- `manifest.json` — app metadata',
		'- `vite.config.ts` — build configuration'
	]
		.filter(Boolean)
		.join('\n');

	writeFileSync(
		join(dir, 'README.md'),
		`# ${config.displayName}

${config.description || 'ElyOS plugin.'}

## Development

${devSection}

## Build

\`\`\`bash
bun run build
\`\`\`
${isSidebar ? '\n> The `build` command runs `build-all.js`, which builds the main app and all sidebar components.\n' : ''}
## Structure

${structureLines}

## License

MIT
`
	);
}

// ---------------------------------------------------------------------------
// Placeholder csere
// ---------------------------------------------------------------------------

/**
 * __PLUGIN_ID__ → config.pluginId
 * __PLUGIN_ID_UNDERSCORE__ → config.pluginId.replace(/-/g, '_')
 */
function replaceTemplatePlaceholders(targetDir: string, config: PluginConfig): void {
	const pluginIdUnderscore = config.pluginId.replace(/-/g, '_');
	const replaceable = new Set(['.svelte', '.ts', '.js', '.json', '.yml', '.env']);

	function walkAndReplace(dir: string): void {
		for (const entry of readdirSync(dir)) {
			const fullPath = join(dir, entry);
			const stat = statSync(fullPath);
			if (stat.isDirectory()) {
				if (entry === 'node_modules') continue;
				walkAndReplace(fullPath);
			} else if (replaceable.has(extname(entry)) || entry === '.env.example') {
				let content = readFileSync(fullPath, 'utf-8');
				const original = content;
				content = content.replaceAll('__PLUGIN_ID_UNDERSCORE__', pluginIdUnderscore);
				content = content.replaceAll('__PLUGIN_ID__', config.pluginId);
				if (content !== original) writeFileSync(fullPath, content);
			}
		}
	}

	walkAndReplace(targetDir);
}
