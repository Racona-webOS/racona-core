<!--
 Ablak tartalma, a keret (fejléc, átméretezés) nélkül.
 Az asztali Window és a mobil keret is ezt használja. Beállítja az app kontextust
 (paraméterek, ablak azonosító), és a betöltés módja szerint rendereli az appot:
 beépített komponens, menüs plugin (PluginLayoutWrapper) vagy plugin egyedi elemként.
 -->
<script lang="ts">
	import { setContext } from 'svelte';
	import { type AppContext, APP_CONTEXT_KEY } from '$lib/services/client/appContext';
	import type { WindowState } from '$lib/stores';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	let { windowState }: { windowState: WindowState } = $props();

	// App kontextus beállítás a gyerek komponensekhez.
	// Context values should be stable, but we can use a getter pattern
	const appContext: AppContext = {
		get parameters() {
			return windowState.parameters || {};
		},
		get windowId() {
			return windowState.id;
		}
	};
	setContext(APP_CONTEXT_KEY, appContext);
</script>

{#if windowState.isLoading}
	<div class="loading">{t('desktop.window.loading')}</div>
{:else if (windowState as any).isPluginWithLayout}
	{@const menuData = (windowState as any).pluginMenuData}
	{@const pluginId = (windowState as any).pluginId}
	{@const pluginLayout = (windowState as any).pluginLayout ?? {}}
	{@const sidebarComponent = (windowState as any).pluginSidebarComponent}
	{@const Component = windowState.component}
	<Component
		{pluginId}
		{menuData}
		maxWidthClass={pluginLayout.maxWidthClass}
		sidebarWidth={pluginLayout.sidebarWidth}
		{sidebarComponent}
	/>
{:else if (windowState as any).customElementTag}
	{@const tagName = (windowState as any).customElementTag}
	{@const props = (windowState as any).pluginProps || {}}
	<svelte:element
		this={tagName}
		data-window-id={props.windowId}
		data-plugin-id={props.pluginId}
		data-parameters={JSON.stringify(props.parameters || {})}
	/>
{:else if windowState.component}
	{@const Component = windowState.component}
	<Component />
{:else}
	<div class="error">{t('desktop.window.loadError')}</div>
{/if}

<style>
	.loading,
	.error {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #666;
	}

	.error {
		color: #d32f2f;
	}
</style>
